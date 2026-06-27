from pydantic import BaseModel
from typing import Optional, List

class DeviceRegisterRequest(BaseModel):
    device_id: str
    hostname: str
    username: str
    device_type: str = "Laptop"
    os: str
    os_version: str
    architecture: str
    processor: str
    ip: str
    status: str = "Online"
    last_seen: str

class DeviceHeartbeatRequest(BaseModel):
    device_id: str
    timestamp: str

class DeviceResponse(BaseModel):
    device_id: str
    hostname: str
    username: Optional[str] = None
    device_type: str
    os: str
    os_version: Optional[str] = None
    architecture: Optional[str] = None
    processor: Optional[str] = None
    ip: Optional[str] = None
    status: str
    last_seen: str
    heartbeat_age: Optional[str] = None

class DeviceListResponse(BaseModel):
    devices: List[DeviceResponse]
