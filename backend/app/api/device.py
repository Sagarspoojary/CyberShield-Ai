from typing import List
from fastapi import APIRouter, status
from app.schemas.device import DeviceRegisterRequest, DeviceHeartbeatRequest, DeviceResponse
from app.services.device_service import device_service

router = APIRouter(tags=["Devices"])

@router.post("/device/register", status_code=status.HTTP_200_OK)
async def register_device(req: DeviceRegisterRequest):
    """
    Register or update an endpoint device in the security registry.
    """
    registered = device_service.register_or_update_device(req)
    return {
        "message": "Device registered successfully",
        "device": registered
    }

@router.post("/device/heartbeat", status_code=status.HTTP_200_OK)
async def device_heartbeat(req: DeviceHeartbeatRequest):
    """
    Receive continuous heartbeat ping from an enterprise endpoint device.
    """
    device_service.update_heartbeat(req)
    return {
        "success": True,
        "message": "Heartbeat received"
    }

@router.get("/devices", response_model=List[DeviceResponse])
async def get_devices():
    """
    Retrieve all registered enterprise security devices with dynamic Online/Offline status.
    """
    return device_service.get_all_devices()
