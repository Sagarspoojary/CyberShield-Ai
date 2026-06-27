import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassButton } from '../components/GlassButton';
import { GlassCard } from '../components/GlassCard';
import { Shield, Sparkles, Terminal, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage = () => {
  const navigate = useNavigate();

  const secFeatures = [
    {
      icon: Activity,
      title: "Real-Time Intrusion Monitoring",
      description: "Analyze packets per second and network connection speeds live on visual Bento grids.",
    },
    {
      icon: Cpu,
      title: "AI Detection Engine",
      description: "Auto-scans incoming requests with high confidence indexes and triggers containment protocols.",
    },
    {
      icon: ShieldAlert,
      title: "Containment Response",
      description: "Generate incident reports and block hostile source IPs instantly with integrated firewalls.",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-between pt-16 z-10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="text-center max-w-4xl"
        >
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wider uppercase mb-6 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            AI-Powered Cyber Defense Protocol
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight font-display mb-8">
            <span className="block text-slate-100">AI-Powered Real-Time</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              Cyber Threat Defense
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-slate-400 font-sans mb-10 max-w-3xl mx-auto leading-relaxed">
            CyberShield AI delivers sub-millisecond intrusion detection, active packets monitoring, and automated response frameworks in a single high-fidelity cockpit.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <GlassButton
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 text-base bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-purple-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
              Deploy Terminal
            </GlassButton>
            <GlassButton
              onClick={() => navigate('/login')}
              variant="secondary"
              className="w-full sm:w-auto px-8 py-4 text-base"
            >
              Access Console
            </GlassButton>
          </div>
        </motion.div>

        {/* Cyber features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-8">
          {secFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                <GlassCard tiltEffect={true} className="p-8 h-full flex flex-col items-start gap-4">
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display tracking-wide dark:text-slate-100 text-slate-900 mt-2">
                    {feat.title}
                  </h3>
                  <p className="text-sm dark:text-slate-400 text-slate-500 font-sans leading-relaxed">
                    {feat.description}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-[10px] font-mono tracking-widest text-slate-500">
        &copy; {new Date().getFullYear()} CYBERSHIELD AI. ALL SECURE PROTOCOLS ACTIVE.
      </footer>
    </div>
  );
};

export default LandingPage;
