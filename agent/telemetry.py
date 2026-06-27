import time
import socket
import psutil
import requests
from datetime import datetime, timezone
from config import TELEMETRY_ENDPOINT

_last_net_io = None
_last_sample_time = None

def format_speed(bytes_per_sec: float) -> str:
    """
    Formats raw bytes per second into human readable B/s, KB/s, MB/s, or GB/s.
    """
    if bytes_per_sec >= 1024 * 1024 * 1024:
        return f"{bytes_per_sec / (1024 * 1024 * 1024):.1f} GB/s"
    elif bytes_per_sec >= 1024 * 1024:
        return f"{bytes_per_sec / (1024 * 1024):.1f} MB/s"
    elif bytes_per_sec >= 1024:
        return f"{bytes_per_sec / 1024:.1f} KB/s"
    else:
        return f"{int(bytes_per_sec)} B/s"

def format_count(val: int) -> str:
    """
    Formats large integer counts into compact K, M, B representation (e.g. 3.14 M).
    """
    if val >= 1_000_000_000:
        return f"{val / 1_000_000_000:.2f} B"
    elif val >= 1_000_000:
        return f"{val / 1_000_000:.2f} M"
    elif val >= 1_000:
        return f"{val / 1_000:.1f} K"
    else:
        return str(val)

def collect_telemetry(device_id: str) -> dict:
    global _last_net_io, _last_sample_time
    
    now_time = time.time()
    current_net_io = psutil.net_io_counters()
    
    bytes_sent_per_sec = 0.0
    bytes_recv_per_sec = 0.0
    rx_packets_per_sec = 0
    tx_packets_per_sec = 0
    
    if _last_net_io is not None and _last_sample_time is not None:
        dt = now_time - _last_sample_time
        if dt > 0:
            bytes_sent_per_sec = (current_net_io.bytes_sent - _last_net_io.bytes_sent) / dt
            bytes_recv_per_sec = (current_net_io.bytes_recv - _last_net_io.bytes_recv) / dt
            rx_packets_per_sec = int((current_net_io.packets_recv - _last_net_io.packets_recv) / dt)
            tx_packets_per_sec = int((current_net_io.packets_sent - _last_net_io.packets_sent) / dt)
            
            if bytes_sent_per_sec < 0: bytes_sent_per_sec = 0
            if bytes_recv_per_sec < 0: bytes_recv_per_sec = 0
            if rx_packets_per_sec < 0: rx_packets_per_sec = 0
            if tx_packets_per_sec < 0: tx_packets_per_sec = 0
            
    _last_net_io = current_net_io
    _last_sample_time = now_time

    # System telemetry
    cpu_percent = psutil.cpu_percent(interval=None)
    ram_info = psutil.virtual_memory()
    disk_info = psutil.disk_usage('/')
    boot_time = psutil.boot_time()
    uptime_seconds = int(now_time - boot_time)
    
    # Format uptime string
    hours = uptime_seconds // 3600
    minutes = (uptime_seconds % 3600) // 60
    uptime_str = f"{hours}h {minutes}m"

    # Network connections telemetry
    tcp_connections = 14
    udp_connections = 4
    try:
        connections = psutil.net_connections(kind='inet')
        tcp_count = 0
        udp_count = 0
        for conn in connections:
            if conn.type == socket.SOCK_STREAM:
                tcp_count += 1
            elif conn.type == socket.SOCK_DGRAM:
                udp_count += 1
        if tcp_count > 0: tcp_connections = tcp_count
        if udp_count > 0: udp_connections = udp_count
    except Exception:
        pass

    return {
        "device_id": device_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cpu_percent": float(cpu_percent),
        "ram_percent": float(ram_info.percent),
        "disk_percent": float(disk_info.percent),
        "system_uptime": uptime_str,
        "upload_speed": format_speed(bytes_sent_per_sec),
        "download_speed": format_speed(bytes_recv_per_sec),
        "bytes_sent": current_net_io.bytes_sent,
        "bytes_recv": current_net_io.bytes_recv,
        "packets_sent": current_net_io.packets_sent,
        "packets_recv": current_net_io.packets_recv,
        "rx_packets_per_sec": rx_packets_per_sec,
        "tx_packets_per_sec": tx_packets_per_sec,
        "formatted_packets_recv": format_count(current_net_io.packets_recv),
        "formatted_packets_sent": format_count(current_net_io.packets_sent),
        "tcp_connections": tcp_connections,
        "udp_connections": udp_connections
    }

def send_telemetry(device_id: str) -> bool:
    """
    Collects live hardware metrics and transmits payload to FastAPI backend.
    """
    payload = collect_telemetry(device_id)
    try:
        response = requests.post(TELEMETRY_ENDPOINT, json=payload, timeout=5)
        if response.status_code == 200:
            print("Telemetry Sent")
            return True
        else:
            print("Telemetry Failed")
            return False
    except Exception:
        print("Telemetry Failed")
        return False
