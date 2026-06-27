import os
import uuid
import socket
import platform
import getpass
from datetime import datetime, timezone
from config import ID_FILE_PATH

def get_or_create_device_id() -> str:
    """
    Retrieves the persistent UUID from disk or generates a new one once.
    """
    if os.path.exists(ID_FILE_PATH):
        try:
            with open(ID_FILE_PATH, "r") as f:
                device_id = f.read().strip()
                if device_id:
                    return device_id
        except Exception:
            pass

    # Generate persistent unique UUID
    new_id = f"DEV-{str(uuid.uuid4())[:8].upper()}"
    try:
        with open(ID_FILE_PATH, "w") as f:
            f.write(new_id)
    except Exception as e:
        print(f"Warning: Could not save persistent UUID to disk: {e}")

    return new_id

def get_local_ip() -> str:
    """
    Retrieves the active local IP address.
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def collect_device_info() -> dict:
    """
    Collects complete endpoint hardware and operating system telemetry.
    """
    os_name = platform.system()
    if os_name == "Darwin":
        os_name = "macOS"

    return {
        "device_id": get_or_create_device_id(),
        "hostname": socket.gethostname(),
        "username": getpass.getuser(),
        "device_type": "Laptop",
        "os": os_name,
        "os_version": platform.version() or platform.release(),
        "architecture": platform.machine(),
        "processor": platform.processor() or platform.machine(),
        "ip": get_local_ip(),
        "status": "Online",
        "last_seen": datetime.now(timezone.utc).isoformat(),
    }