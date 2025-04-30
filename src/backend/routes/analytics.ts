import express from 'express';
import { getStats, exportData } from '../controllers/analyticsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Analytics endpoints
router.get('/stats', getStats);
router.post('/export', exportData);

export default router;