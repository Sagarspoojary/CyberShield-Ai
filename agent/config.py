import os

BACKEND_URL = os.getenv("CYBERSHIELD_BACKEND_URL", "http://localhost:8000/api/v1")
REGISTER_ENDPOINT = f"{BACKEND_URL}/device/register"
HEARTBEAT_ENDPOINT = f"{BACKEND_URL}/device/heartbeat"
TELEMETRY_ENDPOINT = f"{BACKEND_URL}/device/telemetry"
HEARTBEAT_INTERVAL = 2
TELEMETRY_INTERVAL = 2
ID_FILE_PATH = os.path.join(os.path.dirname(__file__), ".device_id")
