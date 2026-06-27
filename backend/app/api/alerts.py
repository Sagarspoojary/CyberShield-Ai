from fastapi import APIRouter
from app.schemas.alerts import AlertsResponse, AlertItem

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=AlertsResponse)
async def get_alerts():
    """
    Get live system alert notifications stream.
    """
    dummy_alerts = [
        AlertItem(id="1", time="10:31", type="Normal Network Behavior", status="Safe", level="safe"),
        AlertItem(id="2", time="10:25", type="DDoS Traffic Spike Mitigated", status="Mitigated", level="warning"),
        AlertItem(id="3", time="10:20", type="Port Scan Detected (192.168.1.45)", status="Blocked", level="critical"),
    ]
    return AlertsResponse(alerts=dummy_alerts)
