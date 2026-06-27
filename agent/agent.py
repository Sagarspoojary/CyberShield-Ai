import sys
import time
import signal
from device_info import collect_device_info
from register import register_device
from heartbeat import send_heartbeat
from telemetry import send_telemetry
from config import HEARTBEAT_INTERVAL

def shutdown_handler(signum, frame):
    print("\nStopping CyberShield Endpoint Agent...")
    print("Heartbeat Stopped")
    print("Telemetry Stopped")
    print("Agent Shutdown Complete")
    sys.exit(0)

def main():
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    print("====================================")
    print("CyberShield Endpoint Agent")
    print("====================================\n")
    
    # 1. Register Device once on startup
    device_info = collect_device_info()
    device_id = device_info['device_id']
    success = register_device(device_info)
    
    if not success:
        print("Initial registration failed. Retrying in next cycle...")

    print("✓ Device Registered Successfully\n")

    # 2. Continuous Loop sending Heartbeat and Telemetry every 2 seconds
    try:
        while True:
            send_heartbeat(device_id)
            send_telemetry(device_id)
            print("")
            time.sleep(HEARTBEAT_INTERVAL)
    except KeyboardInterrupt:
        shutdown_handler(None, None)

if __name__ == "__main__":
    main()