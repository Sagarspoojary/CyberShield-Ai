from fastapi import APIRouter, status, HTTPException
from app.schemas.telemetry import DeviceTelemetryPayload, DeviceTelemetryResponse
from app.services.device_service import device_service

router = APIRouter(tags=["Telemetry"])

@router.post("/device/telemetry", status_code=status.HTTP_200_OK, response_model=DeviceTelemetryResponse)
async def receive_telemetry(payload: DeviceTelemetryPayload):
    """
    Receive real-time system and network telemetry metrics from an endpoint device.
    Saves telemetry metrics without running prediction per ping (predictions execute on completed flows).
    """
    telem_dict = payload.model_dump()
    device_service.save_telemetry(payload.device_id, telem_dict)
    
    return DeviceTelemetryResponse(success=True, message="Telemetry recorded successfully")

@router.get("/device/telemetry/{device_id}")
async def get_device_telemetry(device_id: str):
    """
    Retrieve the latest recorded telemetry metrics for a given device_id.
    """
    telemetry = device_service.get_latest_telemetry(device_id)
    if not telemetry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No telemetry available for device_id: {device_id}"
        )
    return telemetry
