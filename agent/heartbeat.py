import requests
from datetime import datetime, timezone
from config import HEARTBEAT_ENDPOINT

def send_heartbeat(device_id: str) -> bool:
    """
    Transmits a lightweight periodic heartbeat pulse to the FastAPI backend.
    """
    payload = {
        "device_id": device_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        response = requests.post(HEARTBEAT_ENDPOINT, json=payload, timeout=5)
        if response.status_code == 200:
            print("Heartbeat Sent")
            return True
        else:
            print("Heartbeat Failed")
            return False
    except Exception:
        print("Heartbeat Failed")
        return False
