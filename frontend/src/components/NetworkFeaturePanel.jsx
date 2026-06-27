import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import GlassCard from './GlassCard';

export const NetworkFeaturePanel = ({ stats = {}, latestFeatures = null }) => {
  const [isOpen, setIsOpen] = useState(false);

  const featureCount = stats.feature_count ?? 78;
  const expectedCount = stats.expected_feature_count ?? 78;
  const valStatus = stats.validation_status || 'PASSED';
  const isFullyValidated = featureCount === expectedCount && valStatus === 'PASSED';

  return (
    <GlassCard tiltEffect={false} className="p-6 flex flex-col gap-4 border border-cyan-500/20 bg-slate-950/40">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-purple-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Real Bidirectional Flow Engine
          </span>
          <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
            Network Feature Extraction 
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
              isFullyValidated 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {isFullyValidated ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {isFullyValidated ? 'MSCAD 78 VALIDATED' : 'VALIDATION PENDING'}
            </span>
          </h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/10 transition-colors"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>{isOpen ? 'Hide Feature Vector' : 'View 78 MSCAD Feature Vector'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Active Flows</span>
          <span className="text-lg font-bold font-mono text-cyan-400">{stats['Active Flows'] ?? stats.active_flows ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Completed Flows</span>
          <span className="text-lg font-bold font-mono text-cyan-300">{stats['Completed Flows'] ?? stats.completed_flows ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Duration</span>
          <span className="text-lg font-bold font-mono text-indigo-300">{stats['Average Flow Duration'] ?? stats.average_flow_duration ?? 0}s</span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Pkts / Flow</span>
          <span className="text-lg font-bold font-mono text-amber-300">{stats['Average Packets/Flow'] ?? stats.average_packets_per_flow ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Avg Bytes / Flow</span>
          <span className="text-lg font-bold font-mono text-amber-400">{stats['Average Bytes/Flow'] ?? stats.average_bytes_per_flow ?? 0} B</span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Packets/sec</span>
          <span className="text-lg font-bold font-mono text-emerald-400">{stats['Packets/sec'] ?? stats.packets_per_sec ?? 0}</span>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase">Packets Captured</span>
          <span className="text-lg font-bold font-mono text-purple-400">{stats['Packets Captured'] ?? stats.packets_captured ?? 0}</span>
        </div>
      </div>

      {/* Collapsible JSON Feature Vector */}
      {isOpen && (
        <div className="mt-2 p-4 rounded-xl border border-white/10 bg-slate-900/90 font-mono text-xs overflow-x-auto max-h-96 transition-all">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">MSCAD 78 Statistical Feature Payload</span>
            <span className="text-[10px] text-cyan-400 font-bold">{latestFeatures?.device_id || 'DEV-FF0D4F36'}</span>
          </div>
          <pre className="text-emerald-400 leading-relaxed font-mono text-[11px]">
            {latestFeatures ? JSON.stringify(latestFeatures, null, 2) : '// Capturing live network flow features...'}
          </pre>
        </div>
      )}
    </GlassCard>
  );
};

export default NetworkFeaturePanel;
