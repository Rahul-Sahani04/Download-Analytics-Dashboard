import express from 'express';
import { login, logout, refreshToken, checkTokenBlacklist } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply token blacklist check to all routes
router.use(checkTokenBlacklist);

// Public routes
router.post('/login', login);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticateToken, logout);

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

export default router;