from fastapi import APIRouter
from app.schemas.history import AttackHistoryResponse, AttackHistoryItem

router = APIRouter(prefix="/history", tags=["Attack History"])

@router.get("", response_model=AttackHistoryResponse)
async def get_attack_history():
    """
    Get incident registry history logs.
    """
    dummy_items = [
        AttackHistoryItem(id="1", time="10:25:12", attack="SYN Flood DDoS", severity="High", confidence="98%", status="Contained"),
        AttackHistoryItem(id="2", time="10:20:44", attack="Reconnaissance Port Scan", severity="Medium", confidence="94%", status="Blocked"),
        AttackHistoryItem(id="3", time="10:14:02", attack="SQL Injection Attempt", severity="Critical", confidence="99%", status="Mitigated"),
        AttackHistoryItem(id="4", time="10:02:18", attack="Brute Force SSH", severity="Low", confidence="91%", status="Blocked"),
    ]
    return AttackHistoryResponse(items=dummy_items)
