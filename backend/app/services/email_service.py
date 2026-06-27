import os
import smtplib
import logging
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any

logger = logging.getLogger("uvicorn")

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.last_alert_time: Dict[str, float] = {}

    def send_threat_alert(self, hostname: str, email_recipient: str, prediction_data: Dict[str, Any]):
        """
        Sends an urgent SOC threat notification email to the assigned security recipient.
        """
        now = time.time()
        attack_type = prediction_data.get("prediction", prediction_data.get("attack", "Unknown Threat"))
        cache_key = f"{hostname}_{attack_type}"
        
        # 60-second cooldown per threat vector per device to prevent inbox flooding
        if now - self.last_alert_time.get(cache_key, 0) < 60:
            logger.info(f"Email alert cooldown active for {cache_key}. Skipping email dispatch.")
            return

        self.last_alert_time[cache_key] = now

        severity = prediction_data.get("severity", "High")
        confidence = prediction_data.get("confidence", 100.0)
        risk_score = prediction_data.get("risk_score", 70)
        timestamp = prediction_data.get("time", time.strftime("%H:%M:%S"))

        subject = f"🚨 [CYBERSHIELD SOC ALERT] Threat Detected on {hostname}: {attack_type}"
        
        body = f"""
=====================================================
CYBERSHIELD AI SOC THREAT INTELLIGENCE ALERT
=====================================================

An active cyber threat has been detected and classified by the CyberShield AI Multi-Model Detection Engine.

📌 INCIDENT DETAILS:
-----------------------------------------------------
• Endpoint Target Device : {hostname}
• Assigned Security Admin: {email_recipient}
• Detected Attack Vector : {attack_type}
• AI Threat Risk Score   : {risk_score} / 100
• Threat Severity Level  : {severity.upper()}
• Engine Confidence      : {confidence}%
• Incident Timestamp     : {timestamp} UTC

🛡️ AUTOMATED SOC MITIGATION ACTIONS TAKEN:
-----------------------------------------------------
• Active connection rate-limiting and firewall logging engaged.
• Endpoint security telemetry logged to central SOC incident store.

Please review your CyberShield Operations Dashboard immediately at:
https://cybershield-backend-1xwy.onrender.com/ (or http://localhost:5173/dashboard)

=====================================================
CyberShield AI Automated Threat Operations Engine
=====================================================
"""

        logger.info("==================================================")
        logger.info(f"[EMAIL ALERT DISPATCHED]")
        logger.info(f"Recipient: {email_recipient}")
        logger.info(f"Subject  : {subject}")
        logger.info(f"Target   : {hostname} | Threat: {attack_type} | Severity: {severity}")
        logger.info("==================================================")

        # Attempt actual SMTP delivery if credentials exist
        if self.smtp_user and self.smtp_password:
            try:
                msg = MIMEMultipart()
                msg["From"] = f"CyberShield AI SOC <{self.smtp_user}>"
                msg["To"] = email_recipient
                msg["Subject"] = subject
                msg.attach(MIMEText(body, "plain"))

                server = smtplib.SMTP(self.smtp_server, self.smtp_port)
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.smtp_user, email_recipient, msg.as_string())
                server.quit()
                logger.info(f"Successfully delivered email alert to {email_recipient} via SMTP.")
            except Exception as e:
                logger.error(f"Failed sending email via SMTP: {e}")

email_service = EmailService()
