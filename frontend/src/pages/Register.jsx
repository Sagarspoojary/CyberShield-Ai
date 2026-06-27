import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { Mail, Lock, User, UserPlus, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    if (!name) tempErrors.name = 'Full Name is required';
    if (!email) tempErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Email is invalid';
    
    if (!password) {
      tempErrors.password = 'Password is required';
    } else {
      const criteria = [];
      if (password.length < 8) criteria.push('at least 8 characters');
      if (!/[A-Z]/.test(password)) criteria.push('one uppercase letter');
      if (!/[a-z]/.test(password)) criteria.push('one lowercase letter');
      if (!/[0-9]/.test(password)) criteria.push('one number');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) criteria.push('one special character');
      
      if (criteria.length > 0) {
        tempErrors.password = `Password needs ${criteria.join(', ')}`;
      }
    }
    if (password !== confirmPassword) tempErrors.confirmPassword = 'Passwords do not match';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-20 z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-full max-w-md"
      >
        <GlassCard hoverEffect={false} className="p-8 border-cyan-500/10">
          <div className="text-center mb-8 flex flex-col items-center">
            {/* Animated Shield Logo */}
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-4"
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>

            <h2 className="text-3xl font-extrabold font-display tracking-tight dark:text-slate-100 text-slate-900">
              PROVISION TERMINAL
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-500/80 mt-1">
              Create operator profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <GlassInput
              label="Operator Name"
              placeholder="Operator 01"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              error={errors.name}
              required
            />

            <GlassInput
              label="Terminal Email"
              type="email"
              placeholder="operator@cybershield.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              error={errors.email}
              required
            />

            <GlassInput
              label="Access Key"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              error={errors.password}
              required
            />

            <GlassInput
              label="Confirm Access Key"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
              error={errors.confirmPassword}
              required
            />

            <GlassButton 
              type="submit" 
              loading={loading} 
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border-none shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
              icon={UserPlus}
            >
              Register Terminal
            </GlassButton>
          </form>

          {/* Navigation Helper */}
          <p className="text-center text-xs dark:text-slate-400 text-slate-500 font-sans mt-6 font-medium">
            Active Operator?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-bold">
              Access Console
            </Link>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Register;
