import time
import threading
import logging
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
    ep1 = (src_ip, src_port)
    ep2 = (dst_ip, dst_port)

    if ep1 <= ep2:
        return (ep1, ep2, norm_proto)
    else:
        return (ep2, ep1, norm_proto)

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
        self.has_icmp_request = False
        self.has_icmp_reply = False

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

        # Flow termination rules (Item 1 & 4: FIN or RST terminates TCP flow)
        flags = str(pkt.get("flags", ""))
        if "R" in flags or "F" in flags:
            self.is_closed = True

        if self.protocol == "ICMP":
            if is_fwd:
                self.has_icmp_request = True
            else:
                self.has_icmp_reply = True
            if self.has_icmp_request and self.has_icmp_reply:
                self.is_closed = True

    def is_expired(self, current_time: float, max_lifetime: float = 30.0, idle_timeout: float = 10.0) -> bool:
        if self.is_closed:
            return True
        idle_expired = (current_time - self.last_seen) > idle_timeout
        max_duration_expired = (current_time - self.first_seen) > max_lifetime
        return idle_expired or max_duration_expired

    def is_trigger_fired(self, current_time: float) -> bool:
        if self.prediction_evaluated:
            return False
        return self.is_expired(current_time, max_lifetime=30.0, idle_timeout=10.0)

    def is_valid_size(self) -> bool:
        return True

    def get_summary(self) -> Dict[str, Any]:
        dur = max(0.0001, self.last_seen - self.first_seen) if len(self.packets) > 1 else 0.0
        tot_pkts = self.packet_count
        fwd_pkts = len(self.fwd_packets)
        bwd_pkts = len(self.bwd_packets)
        
        fwd_bytes = sum([p.get("length", 64) for p in self.fwd_packets])
        bwd_bytes = sum([p.get("length", 64) for p in self.bwd_packets])
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
    def __init__(self, max_flow_lifetime: float = 30.0, idle_timeout: float = 10.0, cleanup_interval: float = 1.0):
        self.max_flow_lifetime = max_flow_lifetime
        self.idle_timeout = idle_timeout
        self.cleanup_interval = cleanup_interval
        self.active_flows: Dict[tuple, Flow] = {}
        self.flows_processed_count = 0
        self.completed_flows: List[Flow] = []
        self.classified_flows_count = 0
        self.last_packet_time: float = time.time()
        self.last_completion_time: float = time.time()
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
        logger.info(f"Flow Lifetime = {int(self.max_flow_lifetime)} sec")
        logger.info(f"Idle Timeout = {int(self.idle_timeout)} sec")
        logger.info(f"Cleanup Interval = {int(self.cleanup_interval)} sec")
        self._cleanup_thread = threading.Thread(target=self._background_cleanup_loop, daemon=True)
        self._cleanup_thread.start()
        logger.info("Flow Builder Started")

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

        if self.on_flow_completed_callback:
            try:
                self.on_flow_completed_callback(flow)
            except Exception as e:
                logger.error(f"Error in on_flow_completed callback: {e}")

    def _background_cleanup_loop(self):
        while self.is_running:
            time.sleep(self.cleanup_interval)
            now = time.time()
            flows_to_complete = []

            with self._lock:
                for key, flow in list(self.active_flows.items()):
                    if flow.is_expired(now, max_lifetime=self.max_flow_lifetime, idle_timeout=self.idle_timeout):
                        flows_to_complete.append(flow)

            for flow in flows_to_complete:
                self.complete_flow(flow)

            # 5-second no-flow completion warning
            with self._lock:
                if (now - self.last_completion_time > 5.0) and len(self.active_flows) > 0:
                    oldest_age = round(now - min([f.first_seen for f in self.active_flows.values()]), 2) if self.active_flows else 0.0
                    last_pkt_str = time.strftime("%H:%M:%S", time.localtime(self.last_packet_time))
                    logger.info("WARNING")
                    logger.info("No flows have completed.")
                    logger.info(f"Current Active Flows: {len(self.active_flows)}")
                    logger.info(f"Last Packet Time: {last_pkt_str}")
                    logger.info(f"Oldest Flow Age: {oldest_age}s")

    def add_packet(self, pkt: Dict[str, Any]):
        flow_key = build_flow_key(pkt)
        now = time.time()
        self.last_packet_time = now

        flow_to_immediate_complete = None
        with self._lock:
            if flow_key in self.active_flows:
                flow = self.active_flows[flow_key]
                flow.add_packet(pkt)
                logger.info("FLOW UPDATED")
                if flow.is_closed:
                    flow_to_immediate_complete = flow
            else:
                new_flow = Flow(flow_key, pkt)
                self.active_flows[flow_key] = new_flow
                logger.info("NEW FLOW")
                if new_flow.is_closed:
                    flow_to_immediate_complete = new_flow

        if flow_to_immediate_complete:
            self.complete_flow(flow_to_immediate_complete)

    def get_all_flows_summary(self) -> Dict[str, List[Dict[str, Any]]]:
        with self._lock:
            active_list = [flow.get_summary() for flow in list(self.active_flows.values())[:100]]
            completed_list = [flow.get_summary() for flow in self.completed_flows[-100:]]
            return {
                "active": active_list,
                "completed": completed_list
            }

    def get_stats(self) -> Dict[str, Any]:
        """
        Item 8: Live Dashboard Metrics exposition.
        """
        with self._lock:
            all_flows = list(self.active_flows.values()) + self.completed_flows
            if all_flows:
                durs = [f.last_seen - f.first_seen for f in all_flows if len(f.packets) > 1]
                pkts = [f.packet_count for f in all_flows]
                bytes_list = [f.byte_count for f in all_flows]

                avg_dur = round(sum(durs) / max(1, len(durs)), 2)
                avg_pkts = round(sum(pkts) / max(1, len(pkts)), 1)
                avg_bytes = round(sum(bytes_list) / max(1, len(bytes_list)), 1)
                avg_pkts_sec = round(sum([p / max(0.001, d) for p, d in zip(pkts, durs)]) / max(1, len(durs)), 2) if durs else 0.0
            else:
                avg_dur, avg_pkts, avg_bytes, avg_pkts_sec = 0.0, 0.0, 0.0, 0.0

            waiting_count = sum(1 for f in all_flows if not f.prediction_evaluated)

            return {
                "Current Active Flows": len(self.active_flows),
                "Completed Flows": len(self.completed_flows),
                "Average Flow Duration": avg_dur,
                "Average Packets per Flow": avg_pkts,
                "Average Bytes per Flow": avg_bytes,
                "Average Packets per Second": avg_pkts_sec,
                "Average Flow Lifetime": avg_dur,
                # Metadata keys for API compatibility
                "active_flows_count": len(self.active_flows),
                "completed_flows_count": len(self.completed_flows),
                "flows_processed": self.flows_processed_count,
                "classified_flows_count": self.classified_flows_count,
                "waiting_flows_count": waiting_count,
                "average_flow_duration": avg_dur,
                "average_packets_per_flow": avg_pkts,
                "average_bytes_per_flow": avg_bytes
            }
