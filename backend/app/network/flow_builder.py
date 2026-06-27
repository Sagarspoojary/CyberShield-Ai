import time
import threading
import logging
import traceback
from typing import Dict, Any, List, Optional, Callable

logger = logging.getLogger("uvicorn")

def normalize_protocol(proto: str) -> str:
    p = str(proto).upper().strip()
    if p in ["TCP", "HTTP", "HTTPS", "TLS", "SSL", "SSH", "FTP"]:
        return "TCP"
    elif p in ["UDP", "DNS", "NTP", "DHCP"]:
        return "UDP"
    elif p in ["ICMP", "ICMPV6"]:
        return "ICMP"
    return p

def build_flow_key(pkt: Dict[str, Any]) -> tuple:
    src_ip = str(pkt.get("src_ip", "127.0.0.1"))
    dst_ip = str(pkt.get("dst_ip", "127.0.0.1"))
    src_port = int(pkt.get("src_port", 0))
    dst_port = int(pkt.get("dst_port", 0))
    raw_proto = str(pkt.get("protocol", "TCP"))

    norm_proto = normalize_protocol(raw_proto)
    endpoints = sorted([(src_ip, src_port), (dst_ip, dst_port)])
    return (endpoints[0], endpoints[1], norm_proto)

class Flow:
    def __init__(self, canonical_key: tuple, first_pkt: Dict[str, Any]):
        self.canonical_key = canonical_key
        self.initiator_ip = str(first_pkt.get("src_ip", "127.0.0.1"))
        self.initiator_port = int(first_pkt.get("src_port", 0))
        self.responder_ip = str(first_pkt.get("dst_ip", "127.0.0.1"))
        self.responder_port = int(first_pkt.get("dst_port", 0))
        self.protocol = canonical_key[2]
        
        self.flow_id = f"{self.initiator_ip}:{self.initiator_port}_{self.responder_ip}:{self.responder_port}_{self.protocol}"
        self.start_time = first_pkt.get("time", time.time())
        self.last_time = self.start_time
        
        self.packets: List[Dict[str, Any]] = []
        self.fwd_packets: List[Dict[str, Any]] = []
        self.bwd_packets: List[Dict[str, Any]] = []
        
        self.is_closed = False
        self.prediction_evaluated = False

        self.add_packet(first_pkt)

    @property
    def first_seen(self) -> float:
        return self.start_time

    @property
    def last_seen(self) -> float:
        return self.last_time

    @property
    def packet_count(self) -> int:
        return len(self.packets)

    @property
    def byte_count(self) -> int:
        return sum([p.get("length", 64) for p in self.packets])

    @property
    def fwd_byte_count(self) -> int:
        return sum([p.get("length", 64) for p in self.fwd_packets])

    @property
    def bwd_byte_count(self) -> int:
        return sum([p.get("length", 64) for p in self.bwd_packets])

    @property
    def src_ip(self) -> str:
        return self.initiator_ip

    @property
    def dst_ip(self) -> str:
        return self.responder_ip

    @property
    def src_port(self) -> int:
        return self.initiator_port

    @property
    def dst_port(self) -> int:
        return self.responder_port

    def add_packet(self, pkt: Dict[str, Any]):
        if self.is_closed:
            return
        pkt_time = pkt.get("time", time.time())
        self.last_time = max(self.last_time, pkt_time)
        self.packets.append(pkt)
        
        # Determine direction relative to FIRST packet initiator
        src_ip = str(pkt.get("src_ip", ""))
        src_port = int(pkt.get("src_port", 0))
        
        is_fwd = (src_ip == self.initiator_ip and src_port == self.initiator_port)
        if is_fwd:
            self.fwd_packets.append(pkt)
        else:
            self.bwd_packets.append(pkt)

        # Hybrid Flow Completion Rule: TCP FIN or RST received
        flags = str(pkt.get("flags", ""))
        if "R" in flags or "F" in flags:
            self.is_closed = True

    def is_expired(self, current_time: float) -> bool:
        """
        Hybrid Completion Rules per user specification:
        Complete flow when ANY condition is true:
        - TCP FIN or RST received
        - Idle > 2 seconds
        - Duration >= 5 seconds
        - Packet count >= 30
        - Byte count >= 10000
        - UDP idle > 2 seconds
        - ICMP idle > 2 seconds
        """
        if self.is_closed:
            return True

        idle_time = current_time - self.last_seen
        dur = self.last_seen - self.first_seen

        if idle_time > 2.0:
            return True
        if dur >= 5.0:
            return True
        if self.packet_count >= 30:
            return True
        if self.byte_count >= 10000:
            return True
        return False

    def get_summary(self) -> Dict[str, Any]:
        dur = max(0.0001, self.last_seen - self.first_seen) if len(self.packets) > 1 else 0.0
        tot_pkts = self.packet_count
        fwd_pkts = len(self.fwd_packets)
        bwd_pkts = len(self.bwd_packets)
        
        fwd_bytes = self.fwd_byte_count
        bwd_bytes = self.bwd_byte_count
        tot_bytes = self.byte_count

        pkts_sec = round(tot_pkts / max(0.0001, dur), 2) if dur > 0 else float(tot_pkts)
        bytes_sec = round(tot_bytes / max(0.0001, dur), 2) if dur > 0 else float(tot_bytes)

        return {
            "flow_id": self.flow_id,
            "source_ip": self.initiator_ip,
            "destination_ip": self.responder_ip,
            "protocol": self.protocol,
            "duration": round(dur, 4),
            "forward_packets": fwd_pkts,
            "backward_packets": bwd_pkts,
            "forward_bytes": fwd_bytes,
            "backward_bytes": bwd_bytes,
            "packets_sec": pkts_sec,
            "bytes_sec": bytes_sec,
            "flow_state": "CLOSED" if self.is_closed else "ACTIVE"
        }

class FlowBuilder:
    def __init__(self, cleanup_interval: float = 1.0):
        self.cleanup_interval = cleanup_interval
        self.active_flows: Dict[tuple, Flow] = {}
        self.flows_processed_count = 0
        self.completed_flows: List[Flow] = []
        self.classified_flows_count = 0
        self.last_packet_time: float = time.time()
        self.last_completion_time: float = time.time()
        self.last_completed_flow_id: str = "None"
        self._lock = threading.Lock()
        self.is_running = False
        self._cleanup_thread: Optional[threading.Thread] = None
        self.on_flow_completed_callback: Optional[Callable[[Flow], None]] = None

    def set_on_flow_completed(self, callback: Callable[[Flow], None]):
        self.on_flow_completed_callback = callback

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.info("==========================")
        logger.info("FlowBuilder Started (Hybrid Expiration Mode)")
        logger.info("==========================")
        self._cleanup_thread = threading.Thread(target=self._background_cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def stop(self):
        self.is_running = False
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            self._cleanup_thread.join(timeout=1.0)

    def complete_flow(self, flow: Flow):
        """
        Completes a flow, removes it from active_flows, appends to completed_flows, and triggers callback.
        """
        with self._lock:
            key = flow.canonical_key
            if key in self.active_flows:
                del self.active_flows[key]
            
            flow.prediction_evaluated = True
            self.flows_processed_count += 1
            self.completed_flows.append(flow)
            if len(self.completed_flows) > 500:
                self.completed_flows = self.completed_flows[-500:]
            self.last_completion_time = time.time()
            self.last_completed_flow_id = flow.flow_id

        dur = round(max(0.0001, flow.last_seen - flow.first_seen), 4)
        tot_pkts = flow.packet_count
        fwd_pkts = len(flow.fwd_packets)
        bwd_pkts = len(flow.bwd_packets)
        tot_bytes = flow.byte_count

        logger.info("==========================")
        logger.info("[STAGE 3] Flow completed")
        logger.info("==========================")
        logger.info(f"Flow ID: {flow.flow_id}")
        logger.info(f"Protocol: {flow.protocol}")
        logger.info(f"Duration: {dur}")
        logger.info(f"Packets: {tot_pkts} (Fwd: {fwd_pkts}, Bwd: {bwd_pkts})")
        logger.info(f"Bytes: {tot_bytes}")

        if self.on_flow_completed_callback:
            try:
                self.on_flow_completed_callback(flow)
            except Exception as e:
                logger.error(f"[ERROR] [FlowBuilder] [complete_flow] [Flow ID: {flow.flow_id}]: {e}", exc_info=True)

    def _background_cleanup_loop(self):
        while self.is_running:
            try:
                time.sleep(self.cleanup_interval)
                now = time.time()
                flows_to_complete = []

                with self._lock:
                    for key, flow in list(self.active_flows.items()):
                        if flow.is_expired(now):
                            flows_to_complete.append(flow)

                for flow in flows_to_complete:
                    self.complete_flow(flow)
            except Exception as e:
                logger.error(f"[ERROR] [FlowBuilder] [_background_cleanup_loop]: {e}", exc_info=True)

    def add_packet(self, pkt: Dict[str, Any]):
        try:
            flow_key = build_flow_key(pkt)
            now = time.time()
            self.last_packet_time = now

            flow_to_immediate_complete = None
            with self._lock:
                if flow_key in self.active_flows:
                    flow = self.active_flows[flow_key]
                    flow.add_packet(pkt)
                    dur = round(max(0.0001, flow.last_seen - flow.first_seen), 4)
                    logger.info(f"[STAGE 2] Flow updated | ID: {flow.flow_id} | Packets: {flow.packet_count} | Bytes: {flow.byte_count} | Duration: {dur}s")
                    if flow.is_expired(now):
                        flow_to_immediate_complete = flow
                else:
                    new_flow = Flow(flow_key, pkt)
                    self.active_flows[flow_key] = new_flow
                    logger.info("==========================")
                    logger.info(f"[STAGE 2] Flow created | ID: {new_flow.flow_id} | Proto: {new_flow.protocol}")
                    logger.info("==========================")
                    if new_flow.is_expired(now):
                        flow_to_immediate_complete = new_flow

            if flow_to_immediate_complete:
                self.complete_flow(flow_to_immediate_complete)
        except Exception as e:
            logger.error(f"[ERROR] [FlowBuilder] [add_packet]: {e}", exc_info=True)

    def get_all_flows_summary(self) -> Dict[str, List[Dict[str, Any]]]:
        with self._lock:
            active_list = [flow.get_summary() for flow in list(self.active_flows.values())[:100]]
            completed_list = [flow.get_summary() for flow in self.completed_flows[-100:]]
            return {
                "active": active_list,
                "completed": completed_list
            }

    def get_debug_stats(self) -> Dict[str, Any]:
        now = time.time()
        with self._lock:
            active_list = list(self.active_flows.values())
            all_flows = active_list + self.completed_flows
            
            if all_flows:
                durs = [f.last_seen - f.first_seen for f in all_flows]
                pkts = [f.packet_count for f in all_flows]
                bytes_list = [f.byte_count for f in all_flows]
                avg_dur = round(sum(durs) / len(durs), 2)
                avg_pkts = round(sum(pkts) / len(pkts), 1)
                largest_pkts = max(pkts)
                largest_bytes = max(bytes_list)
            else:
                avg_dur, avg_pkts, largest_pkts, largest_bytes = 0.0, 0.0, 0, 0

            oldest_age = round(now - min([f.first_seen for f in active_list]), 2) if active_list else 0.0

            return {
                "active_flows": len(self.active_flows),
                "completed_flows": len(self.completed_flows),
                "average_packets_per_flow": avg_pkts,
                "average_duration": avg_dur,
                "oldest_active_flow": f"{oldest_age}s",
                "largest_flow_packets": largest_pkts,
                "largest_flow_bytes": largest_bytes,
                "last_completed_flow": self.last_completed_flow_id
            }

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            all_flows = list(self.active_flows.values()) + self.completed_flows
            if all_flows:
                durs = [f.last_seen - f.first_seen for f in all_flows]
                pkts = [f.packet_count for f in all_flows]
                bytes_list = [f.byte_count for f in all_flows]

                avg_dur = round(sum(durs) / max(1, len(durs)), 2)
                avg_pkts = round(sum(pkts) / max(1, len(pkts)), 1)
                avg_bytes = round(sum(bytes_list) / max(1, len(bytes_list)), 1)
            else:
                avg_dur, avg_pkts, avg_bytes = 0.0, 0.0, 0.0

            waiting_count = sum(1 for f in all_flows if not f.prediction_evaluated)

            return {
                "Current Active Flows": len(self.active_flows),
                "Completed Flows": len(self.completed_flows),
                "Average Flow Duration": avg_dur,
                "Average Packets per Flow": avg_pkts,
                "Average Bytes per Flow": avg_bytes,
                "active_flows_count": len(self.active_flows),
                "completed_flows_count": len(self.completed_flows),
                "flows_processed": self.flows_processed_count,
                "classified_flows_count": self.classified_flows_count,
                "waiting_flows_count": waiting_count,
                "average_flow_duration": avg_dur,
                "average_packets_per_flow": avg_pkts,
                "average_bytes_per_flow": avg_bytes
            }
