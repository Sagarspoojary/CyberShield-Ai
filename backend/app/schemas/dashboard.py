from pydantic import BaseModel

class DashboardResponse(BaseModel):
    status: str
    threat_score: int
    packets_per_second: int
    network_speed: str
    active_connections: int
    connected_devices: int
