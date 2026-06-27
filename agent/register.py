import requests
from config import REGISTER_ENDPOINT

def register_device(device_info: dict) -> bool:
    """
    Transmits device telemetry payload to the FastAPI backend registration endpoint.
    """
    try:
        response = requests.post(REGISTER_ENDPOINT, json=device_info, timeout=5)
        if response.status_code == 200:
            return True
        else:
            print(f"Registration API returned status {response.status_code}: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] CyberShield AI Backend is unavailable.")
        print("Please ensure the FastAPI server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"\n[ERROR] Failed to register device: {e}")
        return False
