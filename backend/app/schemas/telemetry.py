from pydantic import BaseModel
from typing import Optional

class DeviceTelemetryPayload(BaseModel):
    device_id: str
    timestamp: str
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    system_uptime: str
    upload_speed: str
    download_speed: str
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    rx_packets_per_sec: Optional[int] = 0
    tx_packets_per_sec: Optional[int] = 0
    formatted_packets_recv: Optional[str] = "0"
    formatted_packets_sent: Optional[str] = "0"
    tcp_connections: int
    udp_connections: int

class DeviceTelemetryResponse(BaseModel):
    success: bool
    message: str
