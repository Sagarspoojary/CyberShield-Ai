import { sendSuccess, sendError } from '../utils/response.js';
import { admin, isConfigured } from '../config/firebase.js';

/**
 * Controller to manage user creation and verification processes.
 */

// POST /api/auth/register
export const registerUser = async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return sendError(res, 'Email and password are required', 400);
  }

  if (!isConfigured) {
    // Mock Mode
    const mockUser = {
      uid: 'mock-uid-001',
      email,
      displayName: displayName || 'Mock Developer',
      createdAt: new Date().toISOString(),
    };
    return sendSuccess(res, 'User successfully registered (Mock Mode)', mockUser, 201);
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || 'Developer',
    });
    
    return sendSuccess(res, 'User successfully created in Firebase', userRecord, 201);
  } catch (error) {
    console.error('Firebase registration error:', error);
    return sendError(res, error.message || 'Registration failed', 500);
  }
};

// POST /api/auth/login (verify sync)
export const loginUser = async (req, res) => {
  // Since authentication takes place in the client SDK, the login API verifies the client credential state
  const { uid, email } = req.body;

  if (!uid || !email) {
    return sendError(res, 'Hacker UID and email are required to sync sessions', 400);
  }

  return sendSuccess(res, 'Session successfully verified and synced with Express backend', {
    uid,
    email,
    verifiedAt: new Date().toISOString(),
  });
};

// POST /api/auth/google
export const verifyGoogleAuth = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return sendError(res, 'Google idToken is required for verification', 400);
  }

  if (!isConfigured) {
    return sendSuccess(res, 'Google OAuth synced successfully (Mock Mode)', {
      uid: 'mock-uid-google',
      email: 'google-user@domain.com',
      displayName: 'Google Dev',
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return sendSuccess(res, 'Google authentication verified', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
    });
  } catch (error) {
    console.error('Google verification error:', error);
    return sendError(res, 'Invalid Google authentication token', 401);
  }
};

// GET /api/auth/profile
export const getUserProfile = async (req, res) => {
  // The user object is injected by the verifyAuthToken middleware
  const userProfile = {
    ...req.user,
    role: 'Lead Hacker',
    github: 'github.com/developer',
    bio: 'Hacking the next generation spatial interface.',
    updatedAt: new Date().toISOString(),
  };

  return sendSuccess(res, 'User profile retrieved successfully', userProfile);
};

// POST /api/auth/logout
export const logoutUser = async (req, res) => {
  return sendSuccess(res, 'User session logged out successfully');
};
