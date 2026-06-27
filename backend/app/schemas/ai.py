from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List

class PredictRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    device_id: Optional[str] = "DEV-FF0D4F36"
    cpu_percent: Optional[float] = 15.0
    ram_percent: Optional[float] = 60.0
    disk_percent: Optional[float] = 5.0
    upload_speed: Optional[str] = "10 KB/s"
    download_speed: Optional[str] = "50 KB/s"
    rx_packets_per_sec: Optional[int] = 100
    tx_packets_per_sec: Optional[int] = 80
    tcp_connections: Optional[int] = 15
    udp_connections: Optional[int] = 5

class PredictResponse(BaseModel):
    prediction: str
    confidence: float
    risk_score: int
    severity: str
    timestamp: str
    features_used: Optional[int] = 66
    recommendations: Optional[List[str]] = None
    time: Optional[str] = None
    inference_time: Optional[float] = None
    features: Optional[Dict[str, Any]] = None

class AiHistoryResponse(BaseModel):
    device_id: str
    history: List[PredictResponse]
