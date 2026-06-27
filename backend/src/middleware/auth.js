import { admin, isConfigured } from '../config/firebase.js';
import { sendError } from '../utils/response.js';

/**
 * Authentication Middleware using Firebase Admin SDK or local mock verification.
 */
export const verifyAuthToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization token is missing or malformed', 401);
  }

  const token = authHeader.split('Bearer ')[1];

  // Check if Firebase is not configured (Mock Mode)
  if (!isConfigured) {
    if (token === 'mock-jwt-token-12345') {
      req.user = {
        uid: 'mock-uid-001',
        email: 'mock-user@domain.com',
        displayName: 'Mock Developer',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
      };
      return next();
    }
    return sendError(res, 'Invalid mock token provided in Mock Mode', 401);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || 'Developer',
      photoURL: decodedToken.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    };
    next();
  } catch (error) {
    console.error('Firebase Auth Verification failed:', error);
    return sendError(res, 'Authentication token validation failed', 401);
  }
};
