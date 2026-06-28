import os
import json
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.schemas.device import DeviceRegisterRequest, DeviceHeartbeatRequest

logger = logging.getLogger("uvicorn")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DEVICES_FILE = os.path.join(DATA_DIR, "devices.json")

from app.services.email_service import email_service

class DeviceService:
    def __init__(self):
        self.telemetry_store: Dict[str, Any] = {}
        self.ai_latest_store: Dict[str, Any] = {}
        self.ai_history_store: Dict[str, List[Any]] = {}
        self._ensure_storage()

    def save_telemetry(self, device_id: str, telemetry_data: Dict[str, Any]):
        self.telemetry_store[device_id] = telemetry_data

        # Evaluate Dynamic AI Threat Classification based on exact user packet specifications:
        # normal: 20-100, Brute Force: 200-500, Web Crawling: 500-2000, HTTP DDoS: 2000+, Port Scan: below 20
        rx_pkt = telemetry_data.get("rx_packets_per_sec", 0) or 0
        tx_pkt = telemetry_data.get("tx_packets_per_sec", 0) or 0
        total_pkt = rx_pkt + tx_pkt

        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S")
        now_iso = datetime.now(timezone.utc).isoformat()

        if total_pkt >= 2000:
            pred = "HTTP_DDoS"
            risk = 98
            sev = "Critical"
            conf = 99.9
        elif 500 <= total_pkt < 2000:
            pred = "Web_Crwling"
            risk = 35
            sev = "Low"
            conf = 94.0
        elif 200 <= total_pkt < 500:
            pred = "Brute_Force"
            risk = 78
            sev = "High"
            conf = 97.5
        else:
            pred = "Normal"
            risk = 5
            sev = "Low"
            conf = 100.0

        ai_payload = {
            "prediction": pred,
            "attack": pred,
            "confidence": conf,
            "risk_score": risk,
            "severity": sev,
            "timestamp": now_iso,
            "time": now_str,
            "last_prediction_time": now_str
        }

        self.save_ai_prediction(device_id, ai_payload)

    def get_latest_telemetry(self, device_id: str) -> Dict[str, Any]:
        return self.telemetry_store.get(device_id, None)

    def save_ai_prediction(self, device_id: str, prediction_data: Dict[str, Any]):
        self.ai_latest_store[device_id] = prediction_data
        if device_id not in self.ai_history_store:
            self.ai_history_store[device_id] = []
        # Store newest first, max 50 entries
        self.ai_history_store[device_id].insert(0, prediction_data)
        if len(self.ai_history_store[device_id]) > 50:
            self.ai_history_store[device_id] = self.ai_history_store[device_id][:50]

        # Trigger Device-Specific Email Threat Alerts
        pred_attack = prediction_data.get("prediction", prediction_data.get("attack", "Normal"))
        if pred_attack != "Normal":
            devices = self._read_devices()
            dev_obj = next((d for d in devices if d.get("device_id") == device_id), None)
            hostname = dev_obj.get("hostname", "Unknown Endpoint") if dev_obj else "Unknown Endpoint"
            os_type = dev_obj.get("os", "").lower() if dev_obj else ""
            
            # Map exact email addresses based on user specification
            if "mac" in hostname.lower() or "darwin" in os_type or "macos" in os_type or "sagar" in hostname.lower():
                recipients = ["sagarkappettu@gmail.com", "sagar.23cs125@sode-edu.in"]
            elif "laptop" in hostname.lower() or "windows" in os_type or "milan" in hostname.lower():
                recipients = ["milanraj.23cs071@sode-edu.in", "sagarkappettu@gmail.com"]
            else:
                recipients = ["sagarkappettu@gmail.com"]

            for r in recipients:
                email_service.send_threat_alert(hostname, r, prediction_data)

    def get_latest_ai_prediction(self, device_id: str) -> Dict[str, Any]:
        return self.ai_latest_store.get(device_id, {
            "prediction": "Normal",
            "attack": "Normal",
            "confidence": 100.0,
            "risk_score": 5,
            "severity": "Low",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "time": datetime.now(timezone.utc).strftime("%H:%M:%S")
        })

    def get_ai_history(self, device_id: str) -> List[Dict[str, Any]]:
        return self.ai_history_store.get(device_id, [])

    def _ensure_storage(self):
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(DEVICES_FILE):
            with open(DEVICES_FILE, "w") as f:
                json.dump([], f)

    def _read_devices(self) -> List[Dict[str, Any]]:
        try:
            with open(DEVICES_FILE, "r") as f:
                data = json.load(f)
                if isinstance(data, list):
                    return [d for d in data if isinstance(d, dict)]
                elif isinstance(data, dict):
                    return [data]
                return []
        except Exception as e:
            logger.error(f"Error reading devices file: {e}")
            return []

    def _write_devices(self, devices: List[Dict[str, Any]]):
        try:
            with open(DEVICES_FILE, "w") as f:
                json.dump(devices, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing devices file: {e}")

    def register_or_update_device(self, req: DeviceRegisterRequest) -> Dict[str, Any]:
        devices = self._read_devices()
        existing_idx = next((i for i, d in enumerate(devices) if d.get("device_id") == req.device_id), None)
        
        device_data = req.model_dump()
        device_data["last_seen"] = datetime.now(timezone.utc).isoformat()
        
        if existing_idx is not None:
            devices[existing_idx].update(device_data)
            logger.info(f"Updated existing device: {req.hostname} ({req.device_id})")
        else:
            devices.append(device_data)
            logger.info(f"Registered new device: {req.hostname} ({req.device_id})")
            
        self._write_devices(devices)
        return device_data

    def update_heartbeat(self, req: DeviceHeartbeatRequest) -> bool:
        devices = self._read_devices()
        existing_idx = next((i for i, d in enumerate(devices) if d.get("device_id") == req.device_id), None)
        
        if existing_idx is not None:
            now_str = datetime.now(timezone.utc).isoformat()
            devices[existing_idx]["last_seen"] = now_str
            self._write_devices(devices)
            logger.info(f"Heartbeat updated for device: {req.device_id}")
            return True
        else:
            logger.warning(f"Heartbeat received for unregistered device: {req.device_id}")
            return False

    def get_all_devices(self) -> List[Dict[str, Any]]:
        devices = self._read_devices()
        now = datetime.now(timezone.utc)
        processed = []

        for d in devices:
            d_copy = dict(d)
            last_seen_str = d_copy.get("last_seen")
            status = "Offline"
            age_str = "Unknown"

            if last_seen_str:
                try:
                    # Parse ISO timestamp
                    last_dt = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
                    if last_dt.tzinfo is None:
                        last_dt = last_dt.replace(tzinfo=timezone.utc)
                    
                    elapsed_seconds = int((now - last_dt).total_seconds())
                    if elapsed_seconds < 0:
                        elapsed_seconds = 0
                    
                    # 6-second window threshold for Online status
                    if elapsed_seconds <= 6:
                        status = "Online"
                    else:
                        status = "Offline"
                        
                    if elapsed_seconds < 60:
                        age_str = f"{elapsed_seconds} seconds ago"
                    elif elapsed_seconds < 3600:
                        mins = elapsed_seconds // 60
                        age_str = f"{mins} minute{'s' if mins > 1 else ''} ago"
                    else:
                        hours = elapsed_seconds // 3600
                        age_str = f"{hours} hour{'s' if hours > 1 else ''} ago"
                except Exception as e:
                    logger.error(f"Error calculating device status age: {e}")

            d_copy["status"] = status
            d_copy["heartbeat_age"] = age_str
            processed.append(d_copy)

        return processed

device_service = DeviceService()
