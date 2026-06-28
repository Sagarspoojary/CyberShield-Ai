# 🛡️ CyberShield AI: Real-Time SOC Threat Intelligence Platform

![CyberShield AI Banner](https://img.shields.io/badge/CyberShield-SOC_Threat_Intelligence-06b6d4?style=for-the-badge&logo=shield&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**CyberShield AI** is an end-to-end, real-time Security Operations Center (SOC) Threat Intelligence platform engineered to continuously monitor cross-platform endpoint devices (macOS, Windows, Linux). By capturing high-frequency system hardware and network IO packet metrics, CyberShield AI classifies live packet streams into distinct threat vectors (Port Scans, Brute Force, Web Crawling, and HTTP DDoS) and automatically dispatches device-specific email alerts to assigned security engineers.

---

## ✨ Key Features

- **🌐 Cross-Platform Endpoint Agents**: Lightweight Python agents monitoring host hardware (CPU, RAM, Disk) and bidirectional network traffic (`rx_pkt/s`, `tx_pkt/s`).
- **⚡ Side-by-Side Multi-Device Telemetry**: Dedicated 4-card telemetry displays (Hardware, Packets, Speed, AI Risk Evaluation) per registered endpoint in a single futuristic glassmorphism dashboard.
- **🤖 Dynamic AI Risk Evaluation Engine**: Real-time threat classification based on exact packet rate bands:
  - 🟢 **Normal** (`20 – 199 pkts/s`): Standard baseline traffic (5/100 Low Risk).
  - 🔍 **Port Scan** (`< 20 pkts/s`): Host scanning attempt identified (45/100 Medium Risk).
  - ⚡ **Brute Force** (`200 – 499 pkts/s`): Repeated socket authentication loops (78/100 High Risk).
  - 🕷️ **Web Crawling** (`500 – 1,999 pkts/s`): Multi-page scraping across documentation routes (35/100 Low Risk).
  - 🔴 **HTTP DDoS** (`2,000+ pkts/s`): Massive packet flood threatening socket availability (98/100 Critical Risk).
- **📬 Targeted Automated Email Alerts**: Automated SMTP dispatching sending incident details directly to assigned security administrators upon threat detection:
  - 🍏 **`Mac.lan` (macOS)** $\rightarrow$ Dispatches to `sagarkappettu@gmail.com` & `sagar.23cs125@sode-edu.in`.
  - 💻 **`LAPTOP-6MMH740M` (Windows)** $\rightarrow$ Dispatches to `milanraj.23cs071@sode-edu.in`.
- **📄 Instant PDF Incident Auditing**: One-click structured SOC report exporter and live AI model recalibration trigger.

---

## 🏗️ System Architecture & Technology Stack

```
   [ Endpoint Agent (macOS / Windows) ]
                  │
   (Live Telemetry & Packet Sampling via psutil)
                  ▼
 [ Central FastAPI SOC Backend (Render Cloud) ]
       │                                  │
(AI Classification Engine)     (SMTP Alert Dispatcher)
       │                                  │
       ▼                                  ▼
 [ React + Vite SOC Dashboard ]  [ Security Engineer Inbox ]
```

- **Frontend**: React 18, Vite, Lucide React, Recharts, Framer Motion, Tailwind CSS / Vanilla Glassmorphism.
- **Backend API**: FastAPI (Python), Uvicorn, Pydantic, SMTP Email Service.
- **Agent Layer**: Python 3, `psutil`, `requests`, `threading`, `socket`.

---

## 🛠️ Installation & Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Run Central Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Run SOC Operations Dashboard (React Frontend)
```bash
cd frontend
npm install
npm run dev
```
Access dashboard locally at `http://localhost:5173`.

### 4. Start Endpoint Agent (Client Machine)
```bash
python agent/agent.py
```

---

## 🚀 Live Deployments

- 🌐 **Backend API**: `https://cybershield-backend-1xwy.onrender.com/api/v1`
- 💻 **SOC Dashboard**: `https://cyber-shield-ai-rho.vercel.app`

---

## 📝 License
This project is open-source and developed for Hackathon Security Operations Center (SOC) Innovations.
