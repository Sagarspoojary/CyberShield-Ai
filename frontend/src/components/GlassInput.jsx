import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const GlassInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  required = false,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-display">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 text-cyan-400 pointer-events-none z-20">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`
            w-full px-4 py-3 rounded-xl border font-sans text-sm outline-none transition-all duration-200 relative z-10
            ${Icon ? 'pl-11' : ''}
            ${isPassword ? 'pr-11' : ''}
            glass-effect
            bg-slate-900/60 border-white/10 text-slate-100 placeholder:text-slate-500
            focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 focus:bg-slate-900/90
            ${error ? 'border-rose-500/40 focus:border-rose-500/40 focus:ring-rose-500/20' : ''}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-slate-400 hover:text-cyan-400 z-20 p-1 cursor-pointer transition-colors"
            tabIndex="-1"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-rose-500 mt-1 font-medium">{error}</span>
      )}
    </div>
  );
};

export default GlassInput;
