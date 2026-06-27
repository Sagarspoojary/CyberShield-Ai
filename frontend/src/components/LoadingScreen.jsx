import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] animate-blob-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-pink-500/10 rounded-full blur-[100px] animate-blob-medium" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Futuristic glowing logo loader */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="w-16 h-16 rounded-2xl border border-indigo-500/30 glass-effect bg-slate-900/40"
            animate={{
              rotate: [0, 90, 180, 270, 360],
              borderRadius: ["20%", "30%", "40%", "30%", "20%"]
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          />
          <div className="absolute w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
        </div>

        {/* Loading status */}
        <div className="flex flex-col items-center gap-2">
          <motion.h3 
            className="text-lg font-bold font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            AETHER
          </motion.h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
            Loading System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
