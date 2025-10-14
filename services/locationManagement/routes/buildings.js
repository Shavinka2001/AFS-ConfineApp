import express from 'express';
import buildingController, { validateBuilding, validateConfinedSpace } from '../controllers/buildingController.js';
import { authenticate, adminAndManager, adminManagerTechnician } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Get building statistics (accessible by admin and manager)
router.get('/stats', adminAndManager, buildingController.getBuildingStats);

// Get buildings with confined spaces
router.get('/with-confined-spaces', adminAndManager, buildingController.getBuildingsWithConfinedSpaces);

// Get buildings by location
router.get('/location/:locationId', adminManagerTechnician, buildingController.getBuildingsByLocation);

// Get all buildings with filtering and pagination
router.get('/', adminManagerTechnician, buildingController.getBuildings);

// Get a specific building by ID
router.get('/:id', adminManagerTechnician, buildingController.getBuildingById);

// Create a new building (admin and manager only)
router.post('/', adminAndManager, validateBuilding, buildingController.createBuilding);

// Update a building (admin and manager only)
router.put('/:id', adminAndManager, validateBuilding, buildingController.updateBuilding);

// Delete a building (admin and manager only)
router.delete('/:id', adminAndManager, buildingController.deleteBuilding);

// Add confined space to building (admin and manager only)
router.post('/:id/confined-spaces', adminAndManager, validateConfinedSpace, buildingController.addConfinedSpace);

// Remove confined space from building (admin and manager only)
router.delete('/:id/confined-spaces/:spaceId', adminAndManager, buildingController.removeConfinedSpace);

export default router;