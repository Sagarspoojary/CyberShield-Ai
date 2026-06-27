import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Shield, Bell, Search, LogOut, LayoutDashboard, User, Menu, X, Terminal, Clock } from 'lucide-react';
import { GlassButton } from './GlassButton';

export const Navbar = () => {
  const { user, logout, isAuthenticated, isMock } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b dark:border-cyan-500/10 border-slate-900/10 bg-slate-950/60 dark:bg-slate-950/60 backdrop-blur-xl">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-cyan-200 to-indigo-300">
                CYBERSHIELD <span className="text-cyan-400 font-mono text-xs ml-0.5">AI</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-500/80 hidden sm:block">
                SOC Threat Intelligence
              </span>
            </div>
          </Link>

          {/* Clock Display (Shown only when logged in) */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 font-mono text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentTime}</span>
              </div>
            </div>
          )}

          {/* Right Action Items */}
          <div className="hidden md:flex items-center gap-4">
            {isMock && isAuthenticated && (
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                Mock Mode
              </span>
            )}

            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2.5 group pl-2">
                  <img
                    src={user?.photoURL}
                    alt={user?.displayName}
                    className="w-8 h-8 rounded-full border border-cyan-500/30 group-hover:border-cyan-400 transition-colors object-cover shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors font-display">
                      {user?.displayName}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">SecOps Operator</span>
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all border border-transparent hover:border-rose-500/10 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                <Link
                  to="/login"
                  className={`text-xs font-semibold font-display transition-colors ${
                    isActive('/login') ? 'text-cyan-400 font-bold' : 'text-slate-300 hover:text-cyan-300'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`text-xs font-semibold font-display transition-colors ${
                    isActive('/register') ? 'text-cyan-400 font-bold' : 'text-slate-300 hover:text-cyan-300'
                  }`}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 glass-effect border dark:border-white/5 border-slate-900/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/5 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/dashboard') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                Security Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive('/profile') ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4.5 h-4.5" />
                Operator Profile
              </Link>
              <div className="flex items-center gap-3 px-3 pt-3 border-t border-white/5">
                <img
                  src={user?.photoURL}
                  alt={user?.displayName}
                  className="w-9 h-9 rounded-full object-cover border border-cyan-500/30"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{user?.displayName}</p>
                  <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white"
              >
                Sign In
              </Link>
              <GlassButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/register');
                }}
                className="w-full"
              >
                Register
              </GlassButton>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
