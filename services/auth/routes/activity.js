import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getRecentActivities,
  getActivityStats,
  getSystemHealth
} from '../controllers/activityController.js';

const router = express.Router();

// Get recent activities - Admin only
router.get('/recent', protect, authorize('admin'), getRecentActivities);

// Get activity statistics - Admin only
router.get('/stats', protect, authorize('admin'), getActivityStats);

// Get system health metrics - Admin only
router.get('/system-health', protect, authorize('admin'), getSystemHealth);

export default router;