import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { Modal } from '../components/Modal';
import {
  ShieldCheck,
  Activity,
  Cpu,
  Zap,
  Radio,
  Server,
  Network,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Lock,
  RefreshCw,
  BrainCircuit,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { apiService } from '../services/api';
import AiHistoryTable from '../components/AiHistoryTable';
import NetworkFeaturePanel from '../components/NetworkFeaturePanel';

export const Dashboard = () => {
  const { user, isMock } = useAuth();
  const { showToast } = useToast();

  const [threatScore, setThreatScore] = useState(5);
  const [packetsPerSec, setPacketsPerSec] = useState(4520);
  const [networkSpeed, setNetworkSpeed] = useState("1.25 Gbps");
  const [activeConnections, setActiveConnections] = useState(1850);
  const [connectedDevices, setConnectedDevices] = useState(1);
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const [telemetryData, setTelemetryData] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Phase 5 AI Detection State
  const [aiData, setAiData] = useState({
    prediction: "Normal",
    confidence: 98.7,
    risk_score: 5,
    severity: "Low",
    last_prediction_time: "--"
  });
  const [aiTimeline, setAiTimeline] = useState([]);
  const [aiHistoryLogs, setAiHistoryLogs] = useState([]);
  const [aiLoading, setAiLoading] = useState(true);

  // Network Feature Extraction Engine State
  const [networkStats, setNetworkStats] = useState({ active_flows: 0, packets_captured: 0, packets_per_sec: 0, flows_processed: 0, last_extraction_time: '--' });
  const [latestNetworkFeatures, setLatestNetworkFeatures] = useState(null);

  const [alerts, setAlerts] = useState([
    { time: '10:31', type: 'Normal Network Behavior', status: 'Safe', level: 'safe' },
    { time: '10:25', type: 'DDoS Traffic Spike Mitigated', status: 'Mitigated', level: 'warning' },
    { time: '10:20', type: 'Port Scan Detected (192.168.1.45)', status: 'Blocked', level: 'critical' },
  ]);

  const [attackHistory, setAttackHistory] = useState([
    { id: '1', time: '10:25:12', attack: 'SYN Flood DDoS', severity: 'High', confidence: '98%', status: 'Contained' },
    { id: '2', time: '10:20:44', attack: 'Reconnaissance Port Scan', severity: 'Medium', confidence: '94%', status: 'Blocked' },
    { id: '3', time: '10:14:02', attack: 'SQL Injection Attempt', severity: 'Critical', confidence: '99%', status: 'Mitigated' },
    { id: '4', time: '10:02:18', attack: 'Brute Force SSH', severity: 'Low', confidence: '91%', status: 'Blocked' },
  ]);

  // Live dummy data stream simulation & FastAPI syncing
  const [chartData, setChartData] = useState([
    { time: '10:00', normal: 3400, threat: 120 },
    { time: '10:05', normal: 4100, threat: 200 },
    { time: '10:10', normal: 3800, threat: 150 },
    { time: '10:15', normal: 5200, threat: 450 },
    { time: '10:20', normal: 4800, threat: 300 },
    { time: '10:25', normal: 6100, threat: 180 },
    { time: '10:30', normal: 4520, threat: 110 },
  ]);

  useEffect(() => {
    // 1. Initial fetch from FastAPI endpoints
    const fetchFastAPIData = async () => {
      const dashData = await apiService.getDashboard();
      if (dashData) {
        if (dashData.threat_score !== undefined) setThreatScore(dashData.threat_score);
      }

      const devicesData = await apiService.getDevices();
      if (devicesData && Array.isArray(devicesData) && devicesData.length > 0) {
        setRegisteredDevices(devicesData);
        setConnectedDevices(devicesData.length);
        
        const telem = await apiService.getDeviceTelemetry(devicesData[0].device_id);
        if (telem) setTelemetryData(telem);
      }

      const alertsData = await apiService.getAlerts();
      if (alertsData && alertsData.alerts) {
        setAlerts(alertsData.alerts);
      }

      const historyData = await apiService.getHistory();
      if (historyData && historyData.items) {
        setAttackHistory(historyData.items);
      }
    };

    fetchFastAPIData();

    // 2. Interval for 2-second Telemetry & AI Polling
    const telemetryInterval = setInterval(async () => {
      const devices = await apiService.getDevices();
      if (devices && Array.isArray(devices) && devices.length > 0) {
        setRegisteredDevices(devices);
        setConnectedDevices(devices.length);
        const activeDev = devices[0];
        
        const telem = await apiService.getDeviceTelemetry(activeDev.device_id);
        setTelemetryData(telem);

        // Fetch AI prediction & history if online
        if (activeDev.status === 'Online') {
          const aiPred = await apiService.getAiPrediction(activeDev.device_id);
          if (aiPred) {
            setAiData(aiPred);
            if (aiPred.risk_score !== undefined) setThreatScore(aiPred.risk_score);

            // Add to live timeline (last 10)
            const timeStr = aiPred.last_prediction_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setAiTimeline((prev) => {
              const item = { time: timeStr, prediction: aiPred.prediction, severity: aiPred.severity };
              return [item, ...prev.slice(0, 9)];
            });
          }

          const aiHist = await apiService.getAiHistory(activeDev.device_id);
          if (aiHist && Array.isArray(aiHist)) {
            setAiHistoryLogs(aiHist);
          }
          setAiLoading(false);
        }

        // Fetch developer network feature extraction statistics & vector
        const nStats = await apiService.getNetworkStats();
        if (nStats) setNetworkStats(nStats);
        const nFeats = await apiService.getLatestNetworkFeatures();
        if (nFeats) setLatestNetworkFeatures(nFeats);
      } else {
        setTelemetryData(null);
      }
    }, 2000);

    const interval = setInterval(() => {
      setRegisteredDevices((currentDevices) => {
        const isOnline = currentDevices[0]?.status === 'Online';
        if (isOnline) {
          const nextPackets = Math.floor(4000 + Math.random() * 1200);
          setPacketsPerSec(nextPackets);
          
          const newPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            normal: nextPackets,
            threat: Math.floor(100 + Math.random() * 250),
          };

          setChartData((prev) => [...prev.slice(1), newPoint]);
        }
        return currentDevices;
      });
    }, 3000);

    return () => {
      clearInterval(telemetryInterval);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 z-10 relative">
      {/* Upper Cockpit Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SOC Operational
            </span>
            <span className="text-xs font-mono text-slate-500">| Cluster Node #409</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight dark:text-slate-100 text-slate-900">
            Cyber Threat Operations Center
          </h1>
        </div>

        <div className="flex gap-3">
          <GlassButton
            onClick={() => showToast('AI Threat Model re-calibrated successfully', 'success')}
            variant="secondary"
            className="px-4 py-2 text-xs font-mono"
            icon={RefreshCw}
          >
            Re-Calibrate AI
          </GlassButton>
          <GlassButton
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2 text-xs font-mono bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            icon={FileCheck}
          >
            Generate Incident Report
          </GlassButton>
        </div>
      </div>

      {/* Metric Stat Cards Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: System Telemetry (CPU & RAM) */}
        <GlassCard tiltEffect={true} className="p-5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500">
              System Hardware
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Cpu className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {registeredDevices[0]?.status === 'Online' && telemetryData ? `${telemetryData.cpu_percent}%` : '--'} <span className="text-xs font-sans text-slate-400">CPU</span>
            </span>
            <span className="text-xs text-slate-400 font-mono mt-1">
              RAM: {registeredDevices[0]?.status === 'Online' && telemetryData ? `${telemetryData.ram_percent}%` : '--'} | Disk: {registeredDevices[0]?.status === 'Online' && telemetryData ? `${telemetryData.disk_percent}%` : '--'}
            </span>
          </div>
        </GlassCard>

        {/* Card 2: Live Network Packets Rate & Totals */}
        <GlassCard tiltEffect={true} className="p-5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500">
              Network Packets
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-4.5 h-4.5 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold font-mono text-emerald-400">
                ↓ {registeredDevices[0]?.status === 'Online' && telemetryData ? `${telemetryData.rx_packets_per_sec ?? 0} pkt/s` : '0 pkt/s'}
              </span>
              <span className="text-lg font-extrabold font-mono text-cyan-400">
                ↑ {registeredDevices[0]?.status === 'Online' && telemetryData ? `${telemetryData.tx_packets_per_sec ?? 0} pkt/s` : '0 pkt/s'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono mt-1">
              Total: RX {telemetryData ? (telemetryData.formatted_packets_recv || telemetryData.packets_recv) : '--'} | TX {telemetryData ? (telemetryData.formatted_packets_sent || telemetryData.packets_sent) : '--'}
            </span>
          </div>
        </GlassCard>

        {/* Card 3: Live Network Telemetry Speeds */}
        <GlassCard tiltEffect={true} className="p-5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500">
              Live Speed (DL / UL)
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Zap className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold font-mono text-slate-100">
              {registeredDevices[0]?.status === 'Online' && telemetryData ? telemetryData.download_speed : '0 KB/s'}
            </span>
            <span className="text-xs text-indigo-400 font-mono mt-1">
              Upload: {registeredDevices[0]?.status === 'Online' && telemetryData ? telemetryData.upload_speed : '0 KB/s'}
            </span>
          </div>
        </GlassCard>

        {/* Card 4: Active Registered Endpoint Devices */}
        <GlassCard tiltEffect={true} className="p-5 flex flex-col justify-between gap-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-500">
              Registered Devices
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Network className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold font-mono text-slate-100 truncate">
                {registeredDevices[0]?.hostname || 'Mac.lan'}
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                registeredDevices[0]?.status === 'Online'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
              }`}>
                {registeredDevices[0]?.status === 'Online' ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-0.5">
              <span>{registeredDevices[0]?.os || 'macOS'}</span>
              <span className="text-cyan-400/80">Last Seen: {registeredDevices[0]?.heartbeat_age || 'Just Now'}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Middle Section: Live Chart & Threat Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Network Traffic Chart (Recharts) */}
        <GlassCard tiltEffect={true} className="p-6 lg:col-span-2 flex flex-col justify-between gap-6 min-h-[360px]">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
                Real-Time Telemetry
              </span>
              <h2 className="text-xl font-bold font-display text-slate-100">Live Network Traffic Analysis</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Normal Stream
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Threat Vector
              </span>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="normal" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorNormal)" />
                <Area type="monotone" dataKey="threat" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorThreat)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Threat Score Gauge & AI Prediction Card */}
        <GlassCard tiltEffect={true} className="p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
          {/* Offline Overlay */}
          {registeredDevices[0]?.status !== 'Online' && (
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-slate-950/80 rounded-2xl flex flex-col items-center justify-center p-6 text-center gap-3 border border-white/10">
              <ShieldAlert className="w-10 h-10 text-amber-400 animate-pulse" />
              <span className="text-lg font-extrabold font-mono text-slate-100">AI Engine Paused</span>
              <span className="text-xs font-mono text-slate-400">Waiting for device telemetry...</span>
            </div>
          )}

          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5" /> AI Risk Evaluation
            </span>
            <h2 className="text-xl font-bold font-display text-slate-100">Threat Score Gauge</h2>
          </div>

          {aiLoading && registeredDevices[0]?.status === 'Online' ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4 animate-pulse">
              <div className="w-36 h-36 rounded-full bg-slate-800/60" />
              <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Gauge representation */}
              <div className="flex flex-col items-center justify-center py-1 relative">
                <div className="w-36 h-36 rounded-full border-8 border-slate-900 flex flex-col items-center justify-center relative shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                  <div
                    className={`absolute inset-0 rounded-full border-8 border-t-transparent border-r-transparent animate-spin-slow opacity-80 ${
                      threatScore >= 85
                        ? 'border-rose-500'
                        : threatScore >= 60
                        ? 'border-orange-500'
                        : threatScore >= 30
                        ? 'border-amber-500'
                        : 'border-cyan-400'
                    }`}
                    style={{ transform: `rotate(${threatScore * 3.6}deg)`, transition: 'transform 0.5s ease-out' }}
                  />
                  <span className={`text-4xl font-black font-mono ${
                    threatScore >= 85
                      ? 'text-rose-500'
                      : threatScore >= 60
                      ? 'text-orange-400'
                      : threatScore >= 30
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}>{threatScore}</span>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1 font-bold">
                    / 100 {threatScore >= 85 ? 'CRITICAL RISK' : threatScore >= 60 ? 'HIGH RISK' : threatScore >= 30 ? 'MEDIUM RISK' : 'LOW RISK'}
                  </span>
                </div>
              </div>

              {/* AI Prediction Box */}
              <div className="p-4 rounded-xl border border-white/5 bg-slate-900/40 flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">AI Detection Status:</span>
                  <span className={`font-bold ${aiData.prediction === 'Normal' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                    {aiData.prediction === 'Normal' ? '🟢 Normal' : '🔴 Threat Detected'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Predicted Attack:</span>
                  <span className="text-slate-200 font-bold">{aiData.prediction || 'Normal'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Confidence Score:</span>
                  <span className="text-cyan-400 font-bold">
                    {typeof aiData.confidence === 'number' ? `${aiData.confidence.toFixed(1)}%` : aiData.confidence || '98.7%'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-white/5">
                  <span className="text-slate-400">Severity Level:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                    aiData.severity?.toLowerCase() === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : aiData.severity?.toLowerCase() === 'high'
                      ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                      : aiData.severity?.toLowerCase() === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {aiData.severity || 'Low'}
                  </span>
                </div>
              </div>

              {/* AI Prediction Timeline */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-cyan-400" /> AI Prediction Timeline
                </span>
                <div className="flex flex-col gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {aiTimeline.length === 0 ? (
                    <div className="text-[11px] font-mono text-slate-500 py-1">Monitoring timeline events...</div>
                  ) : (
                    aiTimeline.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] font-mono p-1.5 rounded bg-white/5 border border-white/5">
                        <span className="text-slate-400">{item.time}</span>
                        <span className={`font-semibold ${item.prediction === 'Normal' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.prediction}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dynamic Real-Time Incident Alert Summary Box */}
              {(() => {
                const summaryInfo = (() => {
                  const pred = aiData.prediction;
                  switch (pred) {
                    case 'HTTP_DDoS':
                      return {
                        title: 'CRITICAL THREAT: HTTP DDoS Flood',
                        summary: 'Massive packet flood detected (>2,000 pkts). Rapid HTTP requests threaten web socket availability. Rate limiting & WAF rules enabled.',
                        action: 'Rate Limiting & WAF Block Active',
                        badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      };
                    case 'Port_Scan':
                      return {
                        title: 'MEDIUM THREAT: Port Scan Probing',
                        summary: 'Rapid port probing detected (<20 pkts band with SYN flags). Host scanning attempt identified. Firewall logging elevated.',
                        action: 'Source IP Firewall Logging Active',
                        badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      };
                    case 'Brute_Force':
                      return {
                        title: 'HIGH THREAT: Brute Force Stuffing',
                        summary: 'Authentication POST attempts detected (200-500 pkts band). Repeated socket handshakes target login endpoints.',
                        action: 'Account Lockout & MFA Active',
                        badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                      };
                    case 'Web_Crwling':
                      return {
                        title: 'LOW THREAT: Automated Web Crawling',
                        summary: 'Multi-page web scraping detected (500-2,000 pkts band). High subflow byte volume transferred across documentation routes.',
                        action: 'Subflow Request Throttling Active',
                        badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      };
                    default:
                      return {
                        title: 'NORMAL OPERATIONS: Baseline Safe',
                        summary: 'System traffic operating normally within standard baseline limits (20-100 pkts). No anomalies detected on interface en0.',
                        action: 'Continuous SOC Monitoring Active',
                        badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      };
                  }
                })();

                return (
                  <div className="p-3.5 rounded-xl border border-white/10 bg-slate-900/60 flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Live Alert Summary
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${summaryInfo.badgeColor}`}>
                        {aiData.prediction}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                      {summaryInfo.summary}
                    </p>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5 text-[10px] font-mono text-cyan-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{summaryInfo.action}</span>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </GlassCard>
      </div>



      {/* Phase 5: Collapsible AI History Table */}
      <AiHistoryTable 
        history={aiHistoryLogs} 
        isLoading={aiLoading} 
        isOffline={registeredDevices[0]?.status !== 'Online'} 
      />

      {/* Network Flow Feature Extraction Developer Panel */}
      <NetworkFeaturePanel 
        stats={networkStats} 
        latestFeatures={latestNetworkFeatures} 
      />

      {/* AI Action Recommendations Row */}
      <GlassCard tiltEffect={true} className="p-6 flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400">
            Automated Copilot Response
          </span>
          <h2 className="text-lg font-bold font-display text-slate-100">AI Recommendations</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => showToast('Source IP 192.168.1.45 successfully blocked', 'success')}
            className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 flex items-center justify-between transition-all cursor-pointer group text-left"
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs font-display">Block Source IP</span>
              <span className="text-[10px] text-slate-400 font-mono">Target: 192.168.1.45</span>
            </div>
            <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => showToast('Adaptive Firewall Policies re-enforced', 'info')}
            className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-400 flex items-center justify-between transition-all cursor-pointer group text-left"
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs font-display">Enable Firewall</span>
              <span className="text-[10px] text-slate-400 font-mono">Rule Set #808 Active</span>
            </div>
            <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => showToast('Active telemetry polling enabled', 'info')}
            className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 flex items-center justify-between transition-all cursor-pointer group text-left"
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs font-display">Continue Monitoring</span>
              <span className="text-[10px] text-slate-400 font-mono">Stream polling 1s</span>
            </div>
            <Activity className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400 flex items-center justify-between transition-all cursor-pointer group text-left"
          >
            <div className="flex flex-col">
              <span className="font-bold text-xs font-display">Generate Incident Report</span>
              <span className="text-[10px] text-slate-400 font-mono">Export PDF / JSON</span>
            </div>
            <FileCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </GlassCard>

      {/* Modal for Report Generation */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Security Incident Report Generator">
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate an automated SOC incident audit summary containing live traffic logs, threat score metrics, and contained intrusion attempts.
          </p>
          <div className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs font-mono font-bold text-slate-200">report_cybershield_2026.pdf</p>
              <p className="text-[10px] text-slate-500">Includes 14 mitigated event vectors</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <GlassButton onClick={() => setIsReportModalOpen(false)} variant="secondary" className="px-4 py-2 text-xs">
              Cancel
            </GlassButton>
            <GlassButton
              onClick={() => {
                setIsReportModalOpen(false);
                showToast('Incident audit report exported successfully!', 'success');
              }}
              className="px-4 py-2 text-xs bg-gradient-to-r from-cyan-600 to-indigo-600"
            >
              Download Report
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
