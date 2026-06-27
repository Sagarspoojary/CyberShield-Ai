import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GlassCard } from '../components/GlassCard';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { User, Mail, ShieldAlert, Cpu, Terminal, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export const Profile = () => {
  const { user, isMock } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [role, setRole] = useState('Lead Developer');
  const [github, setGithub] = useState('github.com/developer');
  const [bio, setBio] = useState('Building next-gen glassmorphic systems.');
  const [loading, setLoading] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Profile configuration updated successfully!', 'success');
    }, 800);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-6 z-10 relative">
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight dark:text-slate-100 text-slate-900">
          User Settings
        </h1>
        <p className="text-sm dark:text-slate-400 text-slate-500 font-sans">
          Manage your hackathon credentials and team profiles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Avatar card */}
        <GlassCard tiltEffect={true} className="p-6 flex flex-col items-center justify-center text-center gap-4 h-fit">
          <div className="relative">
            <img
              src={user?.photoURL}
              alt={user?.displayName}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            />
            <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white border border-slate-900 shadow">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold dark:text-slate-100 text-slate-950 font-display">
              {user?.displayName}
            </h3>
            <p className="text-xs text-indigo-400 font-semibold font-sans mt-0.5">{role}</p>
          </div>

          <div className="w-full h-px bg-white/5 my-2" />

          <div className="w-full text-left flex flex-col gap-2.5 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Account Status:</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Syncing Method:</span>
              <span className="text-slate-200">{isMock ? 'Mock Auth' : 'Firebase Cloud'}</span>
            </div>
            <div className="flex justify-between">
              <span>UID Reference:</span>
              <span className="text-slate-400 font-mono truncate max-w-[120px]">{user?.uid}</span>
            </div>
          </div>
        </GlassCard>

        {/* Right column: Edit forms */}
        <GlassCard hoverEffect={false} className="p-6 md:col-span-2">
          <h2 className="text-xl font-bold font-display tracking-wide dark:text-slate-100 text-slate-900 mb-6 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            Edit Profile Details
          </h2>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                icon={User}
                required
              />
              <GlassInput
                label="Email (Read Only)"
                value={user?.email || ''}
                icon={Mail}
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Hacker Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                icon={Cpu}
              />
              <GlassInput
                label="GitHub URI"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                icon={Terminal}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-600 font-display">
                Bio / Mission Statement
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border font-sans text-sm outline-none transition-all duration-200 glass-effect dark:bg-slate-900/30 bg-white/20 dark:border-white/5 border-slate-900/10 dark:text-slate-100 text-slate-800 placeholder:text-slate-600 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex justify-end mt-2">
              <GlassButton type="submit" loading={loading} icon={Save} className="px-6">
                Save Changes
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default Profile;
