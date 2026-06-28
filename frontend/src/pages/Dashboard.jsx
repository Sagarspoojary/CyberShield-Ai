import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const selectedDeviceIndexRef = useRef(selectedDeviceIndex);

  useEffect(() => {
    selectedDeviceIndexRef.current = selectedDeviceIndex;
  }, [selectedDeviceIndex]);

  const [telemetryData, setTelemetryData] = useState(null);
  const [deviceTelemetryMap, setDeviceTelemetryMap] = useState({});
  const [deviceAiMap, setDeviceAiMap] = useState({});
  const [deviceAiTimelineMap, setDeviceAiTimelineMap] = useState({});
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
        const idx = selectedDeviceIndex < devicesData.length ? selectedDeviceIndex : 0;
        const telem = await apiService.getDeviceTelemetry(devicesData[idx].device_id);
        if (telem) setTelemetryData(telem);

        const mapAcc = {};
        for (const dev of devicesData) {
          const t = await apiService.getDeviceTelemetry(dev.device_id);
          if (t) mapAcc[dev.device_id] = t;
        }
        setDeviceTelemetryMap(mapAcc);
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
        const currentIdx = selectedDeviceIndexRef.current < devices.length ? selectedDeviceIndexRef.current : 0;
        const activeDev = devices[currentIdx];
        
        const telem = await apiService.getDeviceTelemetry(activeDev.device_id);
        setTelemetryData(telem);

        const mapAcc = {};
        const aiAcc = {};
        for (const dev of devices) {
          const t = await apiService.getDeviceTelemetry(dev.device_id);
          if (t) mapAcc[dev.device_id] = t;
          const p = await apiService.getAiPrediction(dev.device_id);
          if (p) aiAcc[dev.device_id] = p;
        }
        setDeviceTelemetryMap(mapAcc);
        setDeviceAiMap(aiAcc);

        setDeviceAiTimelineMap((prevTimelineMap) => {
          const newMap = { ...prevTimelineMap };
          for (const dev of devices) {
            const p = aiAcc[dev.device_id];
            if (p) {
              const timeStr = p.last_prediction_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const currentList = newMap[dev.device_id] || [];
              const item = { time: timeStr, prediction: p.prediction, severity: p.severity };
              newMap[dev.device_id] = [item, ...currentList.slice(0, 9)];
            }
          }
          return newMap;
        });

        // Fetch AI prediction & history for active selected device
        const activeAi = aiAcc[activeDev.device_id] || await apiService.getAiPrediction(activeDev.device_id);
        if (activeAi) {
          setAiData(activeAi);
          if (activeAi.risk_score !== undefined) setThreatScore(activeAi.risk_score);

          // Add to live timeline (last 10)
          const timeStr = activeAi.last_prediction_time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAiTimeline((prev) => {
            const item = { time: timeStr, prediction: activeAi.prediction, severity: activeAi.severity };
            return [item, ...prev.slice(0, 9)];
          });
        }

        const aiHist = await apiService.getAiHistory(activeDev.device_id);
        if (aiHist && Array.isArray(aiHist)) {
          setAiHistoryLogs(aiHist);
        }
        setAiLoading(false);

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
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
              <Server className="w-3 h-3 text-cyan-400" /> Cluster Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight dark:text-slate-100 text-slate-900">
            Cyber Threat Operations Center
          </h1>
        </div>

        <div className="flex gap-3">
          <GlassButton
            onClick={() => window.location.reload()}
            variant="secondary"
            className="px-4 py-2 text-xs font-mono"
            icon={RefreshCw}
          >
            Re-Calibrate AI
          </GlassButton>
        </div>
      </div>

      {/* Multi-Device Separate Telemetry Displays Container */}
      {/* Multi-Device Dedicated Telemetry & AI Evaluation Panels */}
      <div className="flex flex-col gap-6">
        {registeredDevices.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassCard tiltEffect={true} className="p-5 flex flex-col justify-between gap-3">
              <span className="text-xs font-mono text-slate-400">No active telemetry devices connected</span>
            </GlassCard>
          </div>
        ) : (
          registeredDevices.map((dev, devIdx) => {
            const devTelem = deviceTelemetryMap[dev.device_id] || (devIdx === selectedDeviceIndex ? telemetryData : null);
            
            // Real-time frontend AI classification based on exact packet specifications
            const devAi = (() => {
              if (devTelem && (devTelem.rx_packets_per_sec !== undefined || devTelem.tx_packets_per_sec !== undefined)) {
                const tot = (devTelem.rx_packets_per_sec || 0) + (devTelem.tx_packets_per_sec || 0);
                if (tot >= 2000) return { prediction: "HTTP_DDoS", attack: "HTTP_DDoS", confidence: 99.9, risk_score: 98, severity: "Critical" };
                if (tot >= 500) return { prediction: "Web_Crwling", attack: "Web_Crwling", confidence: 94.0, risk_score: 35, severity: "Low" };
                if (tot >= 200) return { prediction: "Brute_Force", attack: "Brute_Force", confidence: 97.5, risk_score: 78, severity: "High" };
              }
              return deviceAiMap[dev.device_id] || (devIdx === selectedDeviceIndex ? aiData : { prediction: "Normal", attack: "Normal", confidence: 100.0, risk_score: 5, severity: "Low" });
            })();

            const devTimeline = deviceAiTimelineMap[dev.device_id] || (devIdx === selectedDeviceIndex ? aiTimeline : []);
            const devScore = devAi.risk_score !== undefined ? devAi.risk_score : 5;
            const isOnline = dev.status === 'Online';
            const isSelected = devIdx === selectedDeviceIndex;

            const summaryInfo = (() => {
              const pred = devAi.prediction || devAi.attack || 'Normal';
              switch (pred) {
                case 'HTTP_DDoS':
                  return { summary: 'Massive packet flood detected (>2,000 pkts). Rate limiting active.', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
                case 'Port_Scan':
                  return { summary: 'Rapid port probing detected (<20 pkts). Firewall logging active.', badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
                case 'Brute_Force':
                  return { summary: 'Auth stuffing detected (200-500 pkts). Account lockout active.', badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
                case 'Web_Crwling':
                  return { summary: 'Web scraping detected (500-2,000 pkts). Request throttling active.', badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
                default:
                  return { summary: 'System traffic operating normally within standard baseline limits.', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
              }
            })();

            return (
              <div
                key={dev.device_id || devIdx}
                onClick={() => setSelectedDeviceIndex(devIdx)}
                className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-500/40 bg-slate-900/50 shadow-[0_0_25px_rgba(6,182,212,0.12)]'
                    : 'border-white/5 bg-slate-950/30 hover:border-white/10'
                }`}
              >
                {/* Device Header Strip */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                      Endpoint Device #{devIdx + 1}: <span className="text-cyan-400 font-extrabold">{dev.hostname}</span> ({dev.os})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">IP: <span className="text-slate-200">{dev.ip || '127.0.0.1'}</span></span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold border ${
                      isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* 4-Card Grid: Hardware, Packets, Speed & AI Risk Evaluation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: System Hardware */}
                  <GlassCard tiltEffect={false} className="p-4 flex flex-col justify-between gap-2 bg-slate-900/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
                        System Hardware
                      </span>
                      <Cpu className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold font-mono text-emerald-400">
                        {isOnline && devTelem ? `${devTelem.cpu_percent}%` : '--'} <span className="text-xs font-sans text-slate-400">CPU</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono mt-1">
                        RAM: {isOnline && devTelem ? `${devTelem.ram_percent}%` : '--'} | Disk: {isOnline && devTelem ? `${devTelem.disk_percent}%` : '--'}
                      </span>
                    </div>
                  </GlassCard>

                  {/* Card 2: Network Packets */}
                  <GlassCard tiltEffect={false} className="p-4 flex flex-col justify-between gap-2 bg-slate-900/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
                        Network Packets
                      </span>
                      <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold font-mono text-emerald-400">
                          ↓ {isOnline && devTelem ? `${devTelem.rx_packets_per_sec ?? 0} pkt/s` : '0 pkt/s'}
                        </span>
                        <span className="text-lg font-extrabold font-mono text-cyan-400">
                          ↑ {isOnline && devTelem ? `${devTelem.tx_packets_per_sec ?? 0} pkt/s` : '0 pkt/s'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-1">
                        Total: RX {devTelem ? (devTelem.formatted_packets_recv || devTelem.packets_recv) : '--'} | TX {devTelem ? (devTelem.formatted_packets_sent || devTelem.packets_sent) : '--'}
                      </span>
                    </div>
                  </GlassCard>

                  {/* Card 3: Live Speed */}
                  <GlassCard tiltEffect={false} className="p-4 flex flex-col justify-between gap-2 bg-slate-900/60">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
                        Live Speed (DL / UL)
                      </span>
                      <Zap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold font-mono text-slate-100">
                        {isOnline && devTelem ? devTelem.download_speed : '0 KB/s'}
                      </span>
                      <span className="text-xs text-indigo-400 font-mono mt-1">
                        Upload: {isOnline && devTelem ? devTelem.upload_speed : '0 KB/s'}
                      </span>
                    </div>
                  </GlassCard>

                  {/* Card 4: Dedicated AI Risk Evaluation for THIS Device */}
                  <GlassCard tiltEffect={false} className="p-4 flex flex-col justify-between gap-2 bg-slate-900/80 border-cyan-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 flex items-center gap-1">
                        <BrainCircuit className="w-3.5 h-3.5" /> AI Risk Evaluation
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${isOnline ? summaryInfo.badgeColor : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                        {isOnline ? (devAi.prediction || devAi.attack || 'Normal') : 'Normal'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className={`text-xl font-extrabold font-mono ${
                          isOnline && devScore >= 85 ? 'text-rose-500' : isOnline && devScore >= 60 ? 'text-orange-400' : isOnline && devScore >= 30 ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {isOnline ? devScore : 5} <span className="text-xs font-sans text-slate-400">/ 100 Risk</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Status: <span className={!isOnline || (devAi.prediction || 'Normal') === 'Normal' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold animate-pulse'}>
                            {!isOnline || (devAi.prediction || 'Normal') === 'Normal' ? '🟢 Safe' : '🔴 Threat'}
                          </span>
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border ${
                        !isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        devAi.severity?.toLowerCase() === 'critical' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        devAi.severity?.toLowerCase() === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' :
                        devAi.severity?.toLowerCase() === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        {isOnline ? (devAi.severity || 'Low') : 'Low'}
                      </span>
                    </div>

                    {/* Live Small AI Summary Box */}
                    <div className="pt-1.5 border-t border-white/10 flex flex-col gap-0.5">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" /> Summary:
                      </span>
                      <span className="text-[10px] font-mono text-slate-300 leading-tight">
                        {isOnline ? summaryInfo.summary : 'Endpoint offline. Baseline active.'}
                      </span>
                    </div>
                  </GlassCard>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Width Live Network Traffic Chart */}
      <GlassCard tiltEffect={true} className="p-6 flex flex-col justify-between gap-6 min-h-[360px]">
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

        <div className="w-full h-[450px]">
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

        {/* Export / Incident Report Action Footer */}
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold font-mono text-slate-200">Export SOC Analysis Report</span>
            <span className="text-[10px] font-mono text-slate-400">Generate structured PDF/JSON incident audit report for connected devices</span>
          </div>
          <GlassButton
            onClick={() => window.print()}
            className="px-5 py-2.5 text-xs font-mono bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            icon={FileCheck}
          >
            Generate Incident Report
          </GlassButton>
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
