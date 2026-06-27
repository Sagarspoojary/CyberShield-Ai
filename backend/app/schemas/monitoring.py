from pydantic import BaseModel

class MonitoringResponse(BaseModel):
    monitoring: bool
    last_scan: str
    system: str
