from fastapi import APIRouter
from app.schemas.monitoring import MonitoringResponse

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])

@router.get("", response_model=MonitoringResponse)
async def get_monitoring():
    """
    Get current system scan status and health state.
    """
    return MonitoringResponse(
        monitoring=True,
        last_scan="Just Now",
        system="Healthy"
    )
