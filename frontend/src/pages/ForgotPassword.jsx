import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { Mail, ArrowLeft, KeyRound, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    setError('');

    setLoading(true);
    try {
      await resetPassword(email);
      navigate('/login');
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
              RECOVER KEY
            </h2>
            <p className="text-sm dark:text-slate-400 text-slate-500 font-sans mt-2">
              Send terminal recovery code to email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <GlassInput
              label="Terminal Email"
              type="email"
              placeholder="operator@cybershield.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              error={error}
              required
            />

            <GlassButton 
              type="submit" 
              loading={loading} 
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 border-none shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
              icon={KeyRound}
            >
              Send Recovery Code
            </GlassButton>
          </form>

          {/* Go Back Link */}
          <div className="text-center mt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Console
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
