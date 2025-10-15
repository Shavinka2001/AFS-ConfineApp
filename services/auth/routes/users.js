import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  changeUserRole,
  toggleUserStatus,
  approveUser,
  rejectUser,
  getPendingUsers
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin and Manager routes - Managers now have full CRUD access
router.get('/', authorize('admin', 'manager'), getAllUsers);
router.get('/stats', authorize('admin', 'manager'), getUserStats);

// User approval routes - Must be before /:id routes to avoid conflicts
router.get('/pending', authorize('admin', 'manager'), getPendingUsers);
router.put('/:id/approve', authorize('admin', 'manager'), approveUser);
router.put('/:id/reject', authorize('admin', 'manager'), rejectUser);

// These routes must come after specific routes to avoid conflicts
router.get('/:id', authorize('admin', 'manager'), getUserById);
router.post('/', authorize('admin', 'manager'), createUser);
router.put('/:id', authorize('admin', 'manager'), updateUser);
router.delete('/:id', authorize('admin', 'manager'), deleteUser);

// Admin and Manager routes - Both can change roles
router.put('/:id/role', authorize('admin', 'manager'), changeUserRole);

// Admin and Manager routes - Both can toggle user status
router.put('/:id/toggle-status', authorize('admin', 'manager'), toggleUserStatus);

export default router;
