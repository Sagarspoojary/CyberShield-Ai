from pydantic import BaseModel
from typing import List

class AlertItem(BaseModel):
    id: str
    time: str
    type: str
    status: str
    level: str

class AlertsResponse(BaseModel):
    alerts: List[AlertItem]
