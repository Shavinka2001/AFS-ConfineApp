import Location from '../models/Location.js';
import Building from '../models/Building.js';
import { body, validationResult } from 'express-validator';
import axios from 'axios';

class LocationController {
  // Get all locations with filtering and pagination
  async getLocations(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        type = '', 
        technicianAssigned = '',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build filter object
      const filter = { isActive: true };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { 'address.state': { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (type) {
        filter.type = type;
      }

      if (technicianAssigned !== '') {
        if (technicianAssigned === 'true') {
          filter['assignedTechnician.isActive'] = true;
        } else if (technicianAssigned === 'false') {
          filter.$or = [
            { assignedTechnician: { $exists: false } },
            { 'assignedTechnician.isActive': false }
          ];
        }
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      // Get total count for pagination
      const total = await Location.countDocuments(filter);

      // Get locations
      const locations = await Location.find(filter)
        .populate('buildings', 'name status specifications.buildingType')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber)
        .lean();

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        success: true,
        data: {
          locations,
          pagination: {
            current: pageNumber,
            pages: totalPages,
            limit: limitNumber,
            total
          }
        },
        message: 'Locations retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getLocations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve locations'
      });
    }
  }

  // Get a single location by ID
  async getLocationById(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findOne({ _id: id, isActive: true })
        .populate('buildings')
        .lean();

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The requested location does not exist or has been deactivated'
        });
      }

      res.json({
        success: true,
        data: { location },
        message: 'Location retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getLocationById:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid location ID',
          message: 'The provided location ID is not valid'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve location'
      });
    }
  }

  // Create a new location
  async createLocation(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Please check your input data',
          details: errors.array()
        });
      }

      const {
        name,
        description,
        type,
        address,
        coordinates,
        contactInfo,
        status = 'active',
        specifications,
        safety,
        operationalInfo,
        tags
      } = req.body;

      // Check if location name already exists
      const existingLocation = await Location.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isActive: true 
      });

      if (existingLocation) {
        return res.status(409).json({
          success: false,
          error: 'Location already exists',
          message: 'A location with this name already exists'
        });
      }

      const locationData = {
        name,
        description,
        type,
        address,
        coordinates,
        contactInfo,
        status,
        specifications,
        safety,
        operationalInfo,
        tags: tags || [],
        createdBy: req.user.id
      };

      const location = new Location(locationData);
      await location.save();

      res.status(201).json({
        success: true,
        data: { location },
        message: 'Location created successfully'
      });

    } catch (error) {
      console.error('Error in createLocation:', error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Please check your input data',
          details: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          error: 'Duplicate entry',
          message: `${field} already exists. Please choose a different ${field}.`
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create location'
      });
    }
  }

  // Update a location
  async updateLocation(req, res) {
    try {
      const { id } = req.params;
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Please check your input data',
          details: errors.array()
        });
      }

      const location = await Location.findOne({ _id: id, isActive: true });

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The requested location does not exist or has been deactivated'
        });
      }

      // Check if name already exists (excluding current location)
      if (req.body.name && req.body.name !== location.name) {
        const existingLocation = await Location.findOne({
          name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
          _id: { $ne: id },
          isActive: true
        });

        if (existingLocation) {
          return res.status(409).json({
            success: false,
            error: 'Location name already exists',
            message: 'A location with this name already exists'
          });
        }
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (key !== 'id' && key !== '_id' && key !== 'createdBy') {
          location[key] = req.body[key];
        }
      });

      location.lastModifiedBy = req.user.id;
      await location.save();

      res.json({
        success: true,
        data: { location },
        message: 'Location updated successfully'
      });

    } catch (error) {
      console.error('Error in updateLocation:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid location ID',
          message: 'The provided location ID is not valid'
        });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Please check your input data',
          details: Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(409).json({
          success: false,
          error: 'Duplicate entry',
          message: `${field} already exists. Please choose a different ${field}.`
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update location'
      });
    }
  }

  // Delete a location (soft delete)
  async deleteLocation(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findOne({ _id: id, isActive: true });

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The requested location does not exist or has already been deleted'
        });
      }

      // Check if location has buildings
      const buildingCount = await Building.countDocuments({ 
        locationId: id, 
        isActive: true 
      });

      if (buildingCount > 0) {
        return res.status(409).json({
          success: false,
          error: 'Cannot delete location',
          message: `This location has ${buildingCount} buildings. Please remove all buildings before deleting the location.`
        });
      }

      // Soft delete
      location.isActive = false;
      location.lastModifiedBy = req.user.id;
      await location.save();

      res.json({
        success: true,
        message: 'Location deleted successfully'
      });

    } catch (error) {
      console.error('Error in deleteLocation:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid location ID',
          message: 'The provided location ID is not valid'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete location'
      });
    }
  }

  // Assign technician to location
  async assignTechnician(req, res) {
    try {
      const { id } = req.params;
      const { technicianId, name, email, phone, notes } = req.body;

      const location = await Location.findOne({ _id: id, isActive: true });

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The requested location does not exist'
        });
      }

      // Check if technician is already assigned to another active location
      const existingAssignment = await Location.findOne({
        'assignedTechnician.technicianId': technicianId,
        'assignedTechnician.isActive': true,
        _id: { $ne: id },
        isActive: true
      });

      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          error: 'Technician already assigned',
          message: `This technician is already assigned to location: ${existingAssignment.name}`
        });
      }

      // Verify technician exists by calling auth service
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        console.log('Verifying technician:', technicianId, 'at', authServiceUrl);
        const response = await axios.get(`${authServiceUrl}/api/users/${technicianId}`, {
          headers: {
            Authorization: req.headers.authorization
          }
        });

        const technician = response.data.data?.user || response.data?.user;
        console.log('Technician verification response:', technician);
        if (!technician) {
          return res.status(400).json({
            success: false,
            error: 'Invalid technician',
            message: 'The selected technician could not be found'
          });
        }
        
        if (technician.role !== 'technician') {
          return res.status(400).json({
            success: false,
            error: 'Invalid user role',
            message: 'The selected user is not a technician'
          });
        }
      } catch (error) {
        console.error('Error verifying technician:', error.response?.data || error.message);
        // For now, allow assignment even if verification fails
        console.warn('Technician verification failed, proceeding with assignment');
        // return res.status(400).json({
        //   success: false,
        //   error: 'Invalid technician',
        //   message: 'The selected technician could not be verified'
        // });
      }

      const technicianData = {
        technicianId,
        name,
        email,
        phone,
        notes
      };

      await location.assignTechnician(technicianData, req.user.id);

      res.json({
        success: true,
        data: { location },
        message: 'Technician assigned successfully'
      });

    } catch (error) {
      console.error('Error in assignTechnician:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to assign technician'
      });
    }
  }

  // Remove technician from location
  async removeTechnician(req, res) {
    try {
      const { id } = req.params;

      const location = await Location.findOne({ _id: id, isActive: true });

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The requested location does not exist'
        });
      }

      if (!location.assignedTechnician || !location.assignedTechnician.isActive) {
        return res.status(400).json({
          success: false,
          error: 'No active technician',
          message: 'This location does not have an assigned technician'
        });
      }

      await location.removeTechnician(req.user.id);

      res.json({
        success: true,
        data: { location },
        message: 'Technician removed successfully'
      });

    } catch (error) {
      console.error('Error in removeTechnician:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to remove technician'
      });
    }
  }

  // Technician self-remove assignment
  async technicianSelfRemove(req, res) {
    try {
      const technicianId = req.user.id;

      // Find the location assigned to this technician
      const location = await Location.findOne({
        'assignedTechnician.technicianId': technicianId,
        'assignedTechnician.isActive': true,
        isActive: true
      });

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'No assigned location',
          message: 'You do not have any assigned location to remove'
        });
      }

      // Verify the technician is removing their own assignment
      if (location.assignedTechnician.technicianId !== technicianId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized',
          message: 'You can only remove your own assignment'
        });
      }

      await location.removeTechnician(technicianId);

      res.json({
        success: true,
        data: { location },
        message: 'Successfully removed yourself from the assigned location'
      });

    } catch (error) {
      console.error('Error in technicianSelfRemove:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to remove assignment'
      });
    }
  }

  // Get locations by technician
  async getLocationsByTechnician(req, res) {
    try {
      const { technicianId } = req.params;

      const locations = await Location.findByTechnician(technicianId)
        .populate('buildings', 'name status specifications.buildingType')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: { locations },
        message: 'Technician locations retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getLocationsByTechnician:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve technician locations'
      });
    }
  }

  // Get available locations (without active technician)
  async getAvailableLocations(req, res) {
    try {
      const locations = await Location.findAvailable()
        .populate('buildings', 'name status specifications.buildingType')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: { locations },
        message: 'Available locations retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getAvailableLocations:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve available locations'
      });
    }
  }

  // Get location statistics
  async getLocationStats(req, res) {
    try {
      const stats = await Location.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalLocations: { $sum: 1 },
            activeLocations: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            inactiveLocations: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
            },
            maintenanceLocations: {
              $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
            },
            locationsWithTechnician: {
              $sum: { $cond: [{ $eq: ['$assignedTechnician.isActive', true] }, 1, 0] }
            },
            locationsWithoutTechnician: {
              $sum: { 
                $cond: [
                  { 
                    $or: [
                      { $eq: ['$assignedTechnician', null] },
                      { $eq: ['$assignedTechnician.isActive', false] }
                    ]
                  }, 
                  1, 
                  0
                ]
              }
            }
          }
        }
      ]);

      const locationStats = stats[0] || {
        totalLocations: 0,
        activeLocations: 0,
        inactiveLocations: 0,
        maintenanceLocations: 0,
        locationsWithTechnician: 0,
        locationsWithoutTechnician: 0
      };

      // Get building count
      const buildingStats = await Building.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalBuildings: { $sum: 1 },
            activeBuildings: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            }
          }
        }
      ]);

      const buildingData = buildingStats[0] || {
        totalBuildings: 0,
        activeBuildings: 0
      };

      res.json({
        success: true,
        data: {
          ...locationStats,
          ...buildingData
        },
        message: 'Location statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getLocationStats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve location statistics'
      });
    }
  }
}

// Validation middleware
export const validateLocation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location name must be between 1 and 100 characters'),
  body('type')
    .isIn(['residential', 'commercial', 'industrial', 'institutional', 'mixed-use'])
    .withMessage('Invalid location type'),
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('address.zipCode')
    .trim()
    .notEmpty()
    .withMessage('ZIP code is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'under-construction'])
    .withMessage('Invalid status'),
];

export const validateTechnicianAssignment = [
  body('technicianId')
    .notEmpty()
    .withMessage('Technician ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Technician name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

export default new LocationController();