import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';

export const GlassCard = ({ children, className = '', hoverEffect = true, tiltEffect = false, onClick }) => {
  const ref = useRef(null);

  // Parallax Tilt values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs
  const rotateX = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(x, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e) => {
    if (!ref.current || !tiltEffect) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse offset from center (normalized to -0.5 to 0.5)
    const mouseX = e.clientX - rect.left - width / 2;
    const mouseY = e.clientY - rect.top - height / 2;

    // Convert to degrees (max tilt of 10 degrees)
    const rX = -(mouseY / (height / 2)) * 8;
    const rY = (mouseX / (width / 2)) * 8;

    y.set(rX);
    x.set(rY);
  };

  const handleMouseLeave = () => {
    if (!tiltEffect) return;
    y.set(0);
    x.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transformStyle: tiltEffect ? 'preserve-3d' : 'flat',
        rotateX: tiltEffect ? rotateX : 0,
        rotateY: tiltEffect ? rotateY : 0,
      }}
      className={`
        rounded-2xl border
        glass-effect
        dark:bg-slate-950/40 bg-white/20
        dark:border-white/5 border-slate-900/10
        shadow-[0_8px_32px_0_rgba(15,23,42,0.08)]
        dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
        transition-all duration-300
        ${hoverEffect ? 'hover:border-indigo-500/30 hover:shadow-indigo-500/10 dark:hover:bg-slate-950/60 hover:bg-white/40' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={hoverEffect ? { y: -4 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* 3D Depth Content wrapper */}
      <div style={{ transform: tiltEffect ? 'translateZ(20px)' : 'none' }}>
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
