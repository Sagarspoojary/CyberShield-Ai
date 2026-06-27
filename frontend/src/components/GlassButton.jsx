import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const GlassButton = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'glass-effect text-slate-200 dark:border-white/5 border-slate-900/10 dark:hover:bg-white/10 hover:bg-slate-900/5 shadow-[0_4px_12px_rgba(0,0,0,0.1)]';
      case 'danger':
        return 'bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500 shadow-[0_4px_20px_rgba(244,63,94,0.3)] border-transparent';
      case 'primary':
      default:
        return 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-[0_4px_25px_rgba(99,102,241,0.3)] border-transparent';
    }
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      className={`
        relative overflow-hidden flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-display text-sm font-semibold tracking-wide border cursor-pointer transition-all duration-300
        ${getVariantStyles()}
        ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-white" />
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default GlassButton;
