import time
import json
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from app.schemas.reports import ReportsResponse, ReportItem, GenerateReportRequest
from app.services.device_service import device_service

router = APIRouter(prefix="/reports", tags=["Reports"])

generated_reports_store = [
    ReportItem(id="rep-1", title="Weekly Security Audit Summary", generated_at="2026-06-27 10:00:00", size="2.4 MB", status="Ready", format="PDF"),
    ReportItem(id="rep-2", title="DDoS Incident Analysis #409", generated_at="2026-06-25 14:30:00", size="1.1 MB", status="Ready", format="JSON"),
]

@router.get("", response_model=ReportsResponse)
async def get_reports():
    """
    Get generated security incident reports.
    """
    return ReportsResponse(reports=generated_reports_store)

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_report(req: GenerateReportRequest):
    """
    Generate an incident summary report with recommended actions.
    """
    rep_id = f"rep-{len(generated_reports_store) + 1}"
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    new_rep = ReportItem(
        id=rep_id,
        title=req.title,
        generated_at=now_str,
        size="1.5 MB",
        status="Ready",
        format=req.format.upper()
    )
    generated_reports_store.insert(0, new_rep)
    
    latest_pred = device_service.get_latest_ai_prediction(req.device_id)
    
    return {
        "message": "Report generated successfully",
        "report": new_rep,
        "incident_summary": {
            "device_id": req.device_id,
            "threat_detected": latest_pred.get("prediction", "Normal"),
            "confidence": latest_pred.get("confidence", 95.0),
            "severity": latest_pred.get("severity", "Low"),
            "risk_score": latest_pred.get("risk_score", 5),
            "recommended_actions": latest_pred.get("recommendations", ["Continue Monitoring"])
        }
    }

@router.get("/download/{report_id}")
async def download_report(report_id: str):
    """
    Download a security incident report by ID.
    """
    rep = next((r for r in generated_reports_store if r.id == report_id), None)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    
    latest_pred = device_service.get_latest_ai_prediction("DEV-FF0D4F36")
    
    report_payload = {
        "report_id": rep.id,
        "title": rep.title,
        "generated_at": rep.generated_at,
        "status": rep.status,
        "incident_details": {
            "threat_category": latest_pred.get("prediction", "Normal"),
            "severity": latest_pred.get("severity", "Low"),
            "risk_score": latest_pred.get("risk_score", 5),
            "confidence_score": latest_pred.get("confidence", 95.0),
            "recommended_actions": latest_pred.get("recommendations", ["Continue Monitoring"])
        }
    }
    return JSONResponse(content=report_payload)
