import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  changeUserRole,
  toggleUserStatus
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin and Manager routes - Managers now have full CRUD access
router.get('/', authorize('admin', 'manager'), getAllUsers);
router.get('/stats', authorize('admin', 'manager'), getUserStats);
router.get('/:id', authorize('admin', 'manager'), getUserById);
router.post('/', authorize('admin', 'manager'), createUser);
router.put('/:id', authorize('admin', 'manager'), updateUser);
router.delete('/:id', authorize('admin', 'manager'), deleteUser);

// Admin only routes - Only admins can change roles and toggle status
router.put('/:id/role', authorize('admin'), changeUserRole);
router.put('/:id/toggle-status', authorize('admin'), toggleUserStatus);

export default router;
