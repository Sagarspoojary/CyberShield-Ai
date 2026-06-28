import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '../config/firebase';
import { useToast } from './ToastContext';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Set up default axios baseURL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const { showToast } = useToast();

  // Flag to detect if Firebase keys are set
  const isFirebaseConfigured = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY !== 'YOUR_API_KEY';

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Default to active SecOps Operator user if Firebase configuration is not used
      const mockUserStr = localStorage.getItem('mock_user');
      const defaultUser = mockUserStr ? JSON.parse(mockUserStr) : {
        uid: "VkuavyHr2y...",
        email: "sagar.23cs125@sode-edu.in",
        displayName: "Sagar S",
        role: "SecOps Operator",
        photoURL: ""
      };
      setUser(defaultUser);
      setToken("mock-jwt-token-12345");
      axios.defaults.headers.common['Authorization'] = `Bearer mock-jwt-token-12345`;
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          
          // Configure common axios authorization headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          
          // Retrieve extra profiles from backend, or fall back to client profile
          const profileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Developer',
            photoURL: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
          };
          
          setUser(profileData);
        } catch (error) {
          console.error("Error setting user token:", error);
          showToast("Session synchronization failed", "error");
        }
      } else {
        setUser(null);
        setToken(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseConfigured, showToast]);

  const login = async (email, password, remember = false) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      showToast("Logged in successfully", "success");
      return userCredential.user;
    } catch (error) {
      let customMsg = "Failed to log in";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        customMsg = "Invalid email or password, or account is not registered.";
      } else if (error.code === 'auth/invalid-email') {
        customMsg = "Invalid email format. Please enter a valid email.";
      } else if (error.message) {
        customMsg = error.message;
      }
      showToast(customMsg, "error");
      throw new Error(customMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
      });
      showToast("Account created successfully", "success");
      return userCredential.user;
    } catch (error) {
      let customMsg = "Registration failed";
      if (error.code === 'auth/email-already-in-use') {
        customMsg = "This email is already registered. Please sign in instead.";
      } else if (error.code === 'auth/weak-password') {
        customMsg = "Password should be at least 6 characters.";
      } else if (error.message) {
        customMsg = error.message;
      }
      showToast(customMsg, "error");
      throw new Error(customMsg);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      showToast("Google authentication successful", "success");
      return result.user;
    } catch (error) {
      showToast(error.message || "Google sign in failed", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      showToast("GitHub authentication successful", "success");
      return result.user;
    } catch (error) {
      showToast(error.message || "GitHub sign in failed", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('mock_user');
      delete axios.defaults.headers.common['Authorization'];
      setLoading(false);
      showToast("Logged out successfully (Mock Mode)", "success");
      return;
    }

    try {
      await signOut(auth);
      showToast("Logged out successfully", "success");
    } catch (error) {
      showToast(error.message || "Logout failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      showToast("Password reset email sent (Mock Mode)", "success");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent", "success");
    } catch (error) {
      showToast(error.message || "Failed to send reset email", "error");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        logout,
        resetPassword,
        isAuthenticated: !!user,
        isMock: !isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
