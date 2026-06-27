import { Router } from 'express';
import {
  registerUser,
  loginUser,
  verifyGoogleAuth,
  getUserProfile,
  logoutUser,
} from '../controllers/authController.js';
import { verifyAuthToken } from '../middleware/auth.js';

const router = Router();

// Public Authentication sync routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', verifyGoogleAuth);
router.post('/logout', logoutUser);

// Protected Auth Profile route
router.get('/profile', verifyAuthToken, getUserProfile);

export default router;
