from pydantic import BaseModel
from typing import List, Optional

class ReportItem(BaseModel):
    id: str
    title: str
    generated_at: str
    size: str
    status: str
    format: Optional[str] = "PDF"

class ReportsResponse(BaseModel):
    reports: List[ReportItem]

class GenerateReportRequest(BaseModel):
    title: str
    format: str = "JSON"
    device_id: Optional[str] = "DEV-FF0D4F36"
