import React from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground = () => {
  const marqueeText = "CYBER AI SECURITY NETWORK DEFENSE PROTECTION FIREWALL INTRUSION MONITORING RESPONSE ANOMALY ALERT ";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950 select-none">
      {/* 1. Animated Digital Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(6, 182, 212, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 2. Floating Cyber Network Lines & Dots (Ambient SVG Elements) */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Connection Network Lines */}
        <motion.path
          d="M 100,200 L 300,450 L 500,300 L 700,600 M 200,800 L 600,700 L 800,900"
          stroke="url(#cyber-grad)"
          strokeWidth="1.5"
          fill="none"
          animate={{
            strokeDasharray: ["0, 1000", "1000, 0"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M 1200,100 L 1000,350 L 1300,500 L 1100,750"
          stroke="url(#cyber-grad)"
          strokeWidth="1.5"
          fill="none"
          animate={{
            strokeDasharray: ["0, 1000", "1000, 0"],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* 3. Floating Light Blobs (Neon Cyan & Electric Indigo) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 mix-blend-screen filter blur-[120px] animate-blob-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-600/10 dark:bg-indigo-600/5 mix-blend-screen filter blur-[120px] animate-blob-medium" />
      <div className="absolute top-[35%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-purple-600/8 dark:bg-purple-600/4 mix-blend-screen filter blur-[100px] animate-blob-fast" />

      {/* 4. Floating Glowing Particles (GPU Optimized) */}
      <div className="absolute inset-0 opacity-40 dark:opacity-60">
        {[...Array(8)].map((_, i) => {
          const size = Math.random() * 150 + 80;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-tr from-cyan-500/15 to-indigo-500/0 filter blur-[35px]"
              style={{
                width: size,
                height: size,
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
              }}
              animate={{
                x: [0, Math.random() * 80 - 40, Math.random() * 80 - 40, 0],
                y: [0, Math.random() * 80 - 40, Math.random() * 80 - 40, 0],
                scale: [1, 1.15, 0.85, 1],
              }}
              transition={{
                duration: 12 + i * 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* 5. Kinetic Cybersecurity Typography Marquees */}
      <div className="absolute inset-0 flex flex-col justify-between py-16 opacity-[0.015] dark:opacity-[0.02] select-none pointer-events-none">
        {/* Row 1: Leftwards */}
        <div className="overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee font-black uppercase text-[11vw] leading-none tracking-tighter kinetic-text dark:kinetic-text pr-4">
            {marqueeText}
          </div>
          <div className="animate-marquee font-black uppercase text-[11vw] leading-none tracking-tighter kinetic-text dark:kinetic-text pr-4">
            {marqueeText}
          </div>
        </div>

        {/* Row 2: Rightwards */}
        <div className="overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee-reverse-fast font-black uppercase text-[9vw] leading-none tracking-tighter kinetic-text dark:kinetic-text pr-4">
            {marqueeText}
          </div>
          <div className="animate-marquee-reverse-fast font-black uppercase text-[9vw] leading-none tracking-tighter kinetic-text dark:kinetic-text pr-4">
            {marqueeText}
          </div>
        </div>

        {/* Row 3: Leftwards (Slow) */}
        <div className="overflow-hidden flex whitespace-nowrap">
          <div className="animate-marquee-slow font-black uppercase text-[13vw] leading-none tracking-tighter kinetic-text dark:kinetic-text pr-4">
            {marqueeText}
          </div>
          <div className="animate-marquee-slow font-black uppercase text-[13vw] leading-none tracking-tighter kinetic-text dark:kinetic-text pr-4">
            {marqueeText}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbientBackground;
