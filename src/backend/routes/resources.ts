import express from 'express';
import { downloadResource, getResource, searchResources, uploadResource } from '../controllers/resourcesController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Search resources
router.get('/search', searchResources);

// Get resource details
router.get('/:resourceId', getResource);

// Download resource
router.get('/:resourceId/download', downloadResource);

// Upload resource
router.post('/', uploadResource);

export default router;