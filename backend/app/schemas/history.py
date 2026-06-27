from pydantic import BaseModel
from typing import List

class AttackHistoryItem(BaseModel):
    id: str
    time: str
    attack: str
    severity: str
    confidence: str
    status: str

class AttackHistoryResponse(BaseModel):
    items: List[AttackHistoryItem]
