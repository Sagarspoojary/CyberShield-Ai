import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  LogOut,
  Radio,
} from 'lucide-react';

export const Sidebar = () => {
  const { logout, user } = useAuth();

  const secOpsNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-4rem)] fixed left-0 top-16 z-30 border-r dark:border-cyan-500/10 border-slate-900/10 dark:bg-slate-950/40 bg-slate-100/10 backdrop-blur-xl hidden md:flex flex-col justify-between p-4">
      {/* Upper navigation */}
      <div className="flex flex-col gap-6">
        {/* SOC Operations Group */}
        <div>
          <div className="flex items-center justify-between px-3 mb-3">
            <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-cyan-500/80">
              Security Operations
            </h4>
            <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse" /> SOC Active
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {secOpsNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold font-display transition-all duration-200 group
                    ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/5'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Operator Card & Logout */}
      <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <img
            src={user?.photoURL}
            alt={user?.displayName}
            className="w-9 h-9 rounded-full object-cover border border-cyan-500/30"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate font-display">
              {user?.displayName}
            </p>
            <p className="text-[10px] text-cyan-400/80 font-mono truncate">
              ID: {user?.uid?.substring(0, 10)}...
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold font-display text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
