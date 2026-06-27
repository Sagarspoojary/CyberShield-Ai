import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import AmbientBackground from './components/AmbientBackground';
import IntroScreen from './components/IntroScreen';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Play IntroScreen frame animation first without any header overlay */}
      {!isAuthenticated && !introFinished && (
        <IntroScreen onComplete={() => setIntroFinished(true)} />
      )}

      {/* 2. Generative/Kinetic background backdrop */}
      <AmbientBackground />

      {/* 3. Global Header (Rendered on Login page after intro finishes) */}
      {(isAuthenticated || introFinished) && <Navbar />}

      {/* 4. Core App Layout Structure */}
      <div className="flex-1 flex pt-16 relative z-10">
        {/* Render Sidebar only on Protected pages if authenticated */}
        {isAuthenticated && <Sidebar />}

        {/* Content routing wrapper */}
        <main className={`flex-1 transition-all duration-300 ${isAuthenticated ? 'md:pl-64' : ''}`}>
          <Routes>
            <Route path="/" element={!isAuthenticated ? <Navigate to="/login" replace /> : <Navigate to="/dashboard" replace />} />
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected paths */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
