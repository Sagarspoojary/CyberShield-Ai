import sys
import time
import threading
import logging
from typing import Callable, Optional, Dict, Any

logger = logging.getLogger("uvicorn")

class PacketCaptureEngine:
    def __init__(self, packet_callback: Optional[Callable] = None):
        self.packet_callback = packet_callback
        self.is_running = False
        self.sniffer_alive = False
        self._thread: Optional[threading.Thread] = None
        self.packets_captured_count = 0
        self.start_time = time.time()
        self.last_packet_time = time.time()
        self.selected_interface = "en0"
        self.promiscuous = False
        logger.info("Packet Capture Engine Created")

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.start_time = time.time()
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self.is_running = False
        self.sniffer_alive = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        logger.info("Packet Capture Engine Stopped")

    def _detect_interface(self, scapy) -> str:
        """
        Detects working active network interface automatically.
        Prefers 'en0' if available, otherwise selects the first working interface.
        """
        try:
            ifaces = scapy.get_working_ifaces()
            working = [i.name for i in ifaces if hasattr(i, "name") and i.name]
            if "en0" in working:
                return "en0"
            elif working:
                return working[0]
            return str(scapy.conf.iface)
        except Exception as e:
            logger.warning(f"Interface detection notice: {e}")
            return "en0"

    def _capture_loop(self):
        """
        Continuous daemon loop running real Scapy packet sniffing without promiscuous mode.
        """
        try:
            import scapy.all as scapy
            self.selected_interface = self._detect_interface(scapy)
            
            # Item 5: Required startup logging
            logger.info(f"Listening on interface {self.selected_interface}")
            logger.info("Promiscuous Mode: Disabled")
            logger.info("Packet Capture Started")

            def process_pkt(pkt):
                if not self.is_running:
                    return

                self.last_packet_time = time.time()
                self.packets_captured_count += 1
                
                # Item 6: Required packet received logging
                logger.info("PACKET RECEIVED")
                logger.info("FLOW UPDATED")

                pkt_meta = self._parse_scapy_packet(pkt, scapy)
                if pkt_meta:
                    if self.packet_callback:
                        self.packet_callback(pkt_meta)

            # Item 2: Configure global Scapy setting
            scapy.conf.sniff_promisc = False

            while self.is_running:
                self.sniffer_alive = True
                try:
                    # Item 1: Explicit promisc=False sniffing
                    scapy.sniff(
                        iface=self.selected_interface,
                        prn=process_pkt,
                        store=False,
                        promisc=False,
                        timeout=3
                    )
                except Exception as e1:
                    logger.warning(f"Standard sniff notice: {e1}. Retrying with AsyncSniffer fallback...")
                    try:
                        # Item 3: AsyncSniffer fallback
                        async_sniffer = scapy.AsyncSniffer(
                            iface=self.selected_interface,
                            prn=process_pkt,
                            store=False,
                            promisc=False
                        )
                        async_sniffer.start()
                        time.sleep(3.0)
                        if async_sniffer.running:
                            async_sniffer.stop()
                    except Exception as e2:
                        logger.error(f"AsyncSniffer exception: {e2}. Reconnecting in 1s...")
                        self.sniffer_alive = False
                        time.sleep(1.0)

        except Exception as e:
            logger.error(f"Scapy capture engine initialization error: {e}")
            self.sniffer_alive = False
            while self.is_running:
                time.sleep(2.0)

    def _parse_scapy_packet(self, pkt, scapy) -> Optional[dict]:
        """
        Extracts exact real metadata from Scapy packet objects without randomization.
        """
        try:
            now = time.time()
            length = len(pkt)
            
            src_ip, dst_ip = "127.0.0.1", "127.0.0.1"
            src_port, dst_port = 0, 0
            protocol = "IP"
            tcp_flags = ""
            header_len = 20
            window_size = 8192

            if pkt.haslayer(scapy.IP):
                src_ip = pkt[scapy.IP].src
                dst_ip = pkt[scapy.IP].dst
                header_len = pkt[scapy.IP].ihl * 4
            elif pkt.haslayer(scapy.IPv6):
                src_ip = pkt[scapy.IPv6].src
                dst_ip = pkt[scapy.IPv6].dst
                header_len = 40

            if pkt.haslayer(scapy.TCP):
                protocol = "TCP"
                src_port = pkt[scapy.TCP].sport
                dst_port = pkt[scapy.TCP].dport
                tcp_flags = str(pkt[scapy.TCP].flags)
                header_len += pkt[scapy.TCP].dataofs * 4
                window_size = pkt[scapy.TCP].window
            elif pkt.haslayer(scapy.UDP):
                protocol = "UDP"
                src_port = pkt[scapy.UDP].sport
                dst_port = pkt[scapy.UDP].dport
                header_len += 8
            elif pkt.haslayer(scapy.ICMP):
                protocol = "ICMP"
                header_len += 8

            return {
                "time": now,
                "src_ip": str(src_ip),
                "dst_ip": str(dst_ip),
                "src_port": int(src_port),
                "dst_port": int(dst_port),
                "protocol": str(protocol),
                "length": int(length),
                "flags": tcp_flags,
                "header_length": int(header_len),
                "window_size": int(window_size)
            }
        except Exception:
            return None

    def get_capture_status(self, flows_completed: int = 0) -> Dict[str, Any]:
        """
        Item 8: Returns health status dictionary per prompt specification.
        """
        last_sec = round(time.time() - self.last_packet_time, 1) if self.packets_captured_count > 0 else 0
        return {
            "capture_running": self.is_running,
            "sniffer_alive": self.sniffer_alive,
            "interface": self.selected_interface,
            "promiscuous": False,
            "packets_received": self.packets_captured_count,
            "flows_completed": flows_completed,
            "last_packet_seconds_ago": last_sec
        }

    def get_stats(self):
        elapsed = max(1, time.time() - self.start_time)
        return {
            "packets_captured": self.packets_captured_count,
            "packets_per_sec": round(self.packets_captured_count / elapsed, 1)
        }
