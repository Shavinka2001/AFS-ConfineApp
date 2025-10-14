import express from 'express';
import locationController, { validateLocation, validateTechnicianAssignment } from '../controllers/locationController.js';
import { authenticate, adminAndManager, adminManagerTechnician } from '../middleware/auth.js';

const router = express.Router();

// Custom middleware to allow technicians to access their own data
const technicianSelfOrAdminManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please log in first'
    });
  }

  const userRole = req.user.role;
  const requestedTechnicianId = req.params.technicianId;
  const currentUserId = req.user.id;

  // Allow if user is admin or manager
  if (userRole === 'admin' || userRole === 'manager') {
    return next();
  }

  // Allow if user is technician requesting their own data
  if (userRole === 'technician' && currentUserId === requestedTechnicianId) {
    return next();
  }

  // Deny access otherwise
  return res.status(403).json({
    success: false,
    error: 'Access forbidden',
    message: 'Technicians can only access their own assigned locations'
  });
};

// Apply authentication to all routes
router.use(authenticate);

// Get location statistics (accessible by admin and manager)
router.get('/stats', adminAndManager, locationController.getLocationStats);

// Get available locations (without active technician)
router.get('/available', adminAndManager, locationController.getAvailableLocations);

// Get locations by technician (technicians can access their own, admins/managers can access any)
router.get('/technician/:technicianId', technicianSelfOrAdminManager, locationController.getLocationsByTechnician);

// Get all locations with filtering and pagination
router.get('/', adminManagerTechnician, locationController.getLocations);

// Get a specific location by ID
router.get('/:id', adminAndManager, locationController.getLocationById);

// Create a new location (admin and manager only)
router.post('/', adminAndManager, validateLocation, locationController.createLocation);

// Update a location (admin and manager only)
router.put('/:id', adminAndManager, validateLocation, locationController.updateLocation);

// Delete a location (admin and manager only)
router.delete('/:id', adminAndManager, locationController.deleteLocation);

// Assign technician to location (admin and manager only)
router.post('/:id/assign-technician', adminAndManager, validateTechnicianAssignment, locationController.assignTechnician);

// Remove technician from location (admin and manager only)
router.post('/:id/remove-technician', adminAndManager, locationController.removeTechnician);

export default router;