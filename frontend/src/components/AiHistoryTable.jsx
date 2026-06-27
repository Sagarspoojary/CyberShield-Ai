import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, ShieldAlert } from 'lucide-react';
import GlassCard from './GlassCard';

export const AiHistoryTable = ({ history = [], isLoading = false, isOffline = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'low':
      default:
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <GlassCard tiltEffect={false} className="p-6 flex flex-col gap-4">
      <div 
        className="flex justify-between items-center cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-cyan-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> AI Audit Trail
          </span>
          <h2 className="text-lg font-bold font-display text-slate-100 flex items-center gap-2">
            AI Prediction History <span className="text-xs font-mono text-slate-400">({history.length} Logs)</span>
          </h2>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && (
        <div className="mt-2 transition-all duration-300">
          {isOffline ? (
            <div className="p-8 rounded-xl border border-white/5 bg-slate-900/40 text-center flex flex-col items-center justify-center gap-2 opacity-60">
              <ShieldAlert className="w-8 h-8 text-amber-400 animate-pulse" />
              <span className="text-sm font-bold font-mono text-slate-300">AI Engine Paused</span>
              <span className="text-xs font-mono text-slate-500">Waiting for device telemetry...</span>
            </div>
          ) : isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-slate-800/50 rounded animate-pulse w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-slate-500 border border-white/5 rounded-xl bg-slate-900/20">
              No AI prediction history recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Prediction</th>
                    <th className="py-3 px-3">Confidence</th>
                    <th className="py-3 px-3">Risk Score</th>
                    <th className="py-3 px-3 text-right">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-400">{row.time || row.timestamp || '--'}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{row.prediction || row.attack || 'Normal'}</td>
                      <td className="py-3 px-3 font-mono text-cyan-400">
                        {typeof row.confidence === 'number' ? `${row.confidence.toFixed(1)}%` : row.confidence || '98.5%'}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-300">
                        {row.risk_score !== undefined ? row.risk_score : 5} / 100
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border uppercase ${getSeverityBadge(row.severity)}`}>
                          {row.severity || 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
};

export default AiHistoryTable;
