import Building from '../models/Building.js';
import Location from '../models/Location.js';
import { body, validationResult } from 'express-validator';

class BuildingController {
  // Get all buildings with filtering and pagination
  async getBuildings(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        buildingType = '',
        locationId = '',
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      // Build filter object
      const filter = { isActive: true };

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { buildingNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        filter.status = status;
      }

      if (buildingType) {
        filter['specifications.buildingType'] = buildingType;
      }

      if (locationId) {
        filter.locationId = locationId;
      }

      // Build sort object
      const sortObj = {};
      sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      // Get total count for pagination
      const total = await Building.countDocuments(filter);

      // Get buildings
      const buildings = await Building.find(filter)
        .populate('locationId', 'name address type')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber)
        .lean();

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNumber);

      res.json({
        success: true,
        data: {
          buildings,
          pagination: {
            current: pageNumber,
            pages: totalPages,
            limit: limitNumber,
            total
          }
        },
        message: 'Buildings retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getBuildings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve buildings'
      });
    }
  }

  // Get buildings by location
  async getBuildingsByLocation(req, res) {
    try {
      const { locationId } = req.params;

      // Verify location exists
      const location = await Location.findOne({ _id: locationId, isActive: true });
      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The specified location does not exist'
        });
      }

      const buildings = await Building.findByLocation(locationId)
        .lean();

      res.json({
        success: true,
        data: { buildings },
        message: 'Location buildings retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getBuildingsByLocation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve location buildings'
      });
    }
  }

  // Get a single building by ID
  async getBuildingById(req, res) {
    try {
      const { id } = req.params;

      const building = await Building.findOne({ _id: id, isActive: true })
        .populate('locationId', 'name address type')
        .lean();

      if (!building) {
        return res.status(404).json({
          success: false,
          error: 'Building not found',
          message: 'The requested building does not exist or has been deactivated'
        });
      }

      res.json({
        success: true,
        data: { building },
        message: 'Building retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getBuildingById:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid building ID',
          message: 'The provided building ID is not valid'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve building'
      });
    }
  }

  // Create a new building
  async createBuilding(req, res) {
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
        code,
        description,
        locationId,
        buildingNumber,
        address,
        specifications,
        floors,
        units,
        confinedSpaces,
        accessibility,
        safety,
        utilities,
        status = 'active',
        tags
      } = req.body;

      // Verify location exists
      const location = await Location.findOne({ _id: locationId, isActive: true });
      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found',
          message: 'The specified location does not exist'
        });
      }

      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to create buildings'
        });
      }

      // Validate required fields
      if (!name || !locationId || !specifications || !specifications.buildingType || !specifications.totalFloors) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Missing required fields: name, locationId, specifications.buildingType, specifications.totalFloors'
        });
      }

      // Check if building name already exists within the location
      const existingBuilding = await Building.findOne({
        locationId,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isActive: true
      });

      if (existingBuilding) {
        return res.status(409).json({
          success: false,
          error: 'Building already exists',
          message: 'A building with this name already exists in this location'
        });
      }

      const buildingData = {
        name,
        code,
        description,
        locationId,
        buildingNumber,
        address,
        specifications,
        floors: floors || [],
        units: units || [],
        confinedSpaces: confinedSpaces || [],
        accessibility,
        safety,
        utilities,
        status,
        tags: tags || [],
        createdBy: req.user.id
      };

      const building = new Building(buildingData);
      await building.save();

      // Add building to location's buildings array
      await Location.findByIdAndUpdate(
        locationId,
        {
          $push: { buildings: building._id },
          lastModifiedBy: req.user.id
        }
      );

      res.status(201).json({
        success: true,
        data: { building },
        message: 'Building created successfully'
      });

    } catch (error) {
      console.error('Error in createBuilding:', error);
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
        message: 'Failed to create building'
      });
    }
  }

  // Update a building
  async updateBuilding(req, res) {
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

      const building = await Building.findOne({ _id: id, isActive: true });

      if (!building) {
        return res.status(404).json({
          success: false,
          error: 'Building not found',
          message: 'The requested building does not exist or has been deactivated'
        });
      }

      // Check if name already exists in the same location (excluding current building)
      if (req.body.name && req.body.name !== building.name) {
        const existingBuilding = await Building.findOne({
          locationId: building.locationId,
          name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
          _id: { $ne: id },
          isActive: true
        });

        if (existingBuilding) {
          return res.status(409).json({
            success: false,
            error: 'Building name already exists',
            message: 'A building with this name already exists in this location'
          });
        }
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (key !== 'id' && key !== '_id' && key !== 'createdBy' && key !== 'locationId') {
          building[key] = req.body[key];
        }
      });

      building.lastModifiedBy = req.user.id;
      await building.save();

      res.json({
        success: true,
        data: { building },
        message: 'Building updated successfully'
      });

    } catch (error) {
      console.error('Error in updateBuilding:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid building ID',
          message: 'The provided building ID is not valid'
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
        message: 'Failed to update building'
      });
    }
  }

  // Delete a building (soft delete)
  async deleteBuilding(req, res) {
    try {
      const { id } = req.params;

      const building = await Building.findOne({ _id: id, isActive: true });

      if (!building) {
        return res.status(404).json({
          success: false,
          error: 'Building not found',
          message: 'The requested building does not exist or has already been deleted'
        });
      }

      // Soft delete building
      building.isActive = false;
      building.lastModifiedBy = req.user.id;
      await building.save();

      // Remove building from location's buildings array
      await Location.findByIdAndUpdate(
        building.locationId,
        { 
          $pull: { buildings: building._id },
          lastModifiedBy: req.user.id
        }
      );

      res.json({
        success: true,
        message: 'Building deleted successfully'
      });

    } catch (error) {
      console.error('Error in deleteBuilding:', error);
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          error: 'Invalid building ID',
          message: 'The provided building ID is not valid'
        });
      }
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete building'
      });
    }
  }

  // Add confined space to building
  async addConfinedSpace(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        location: spaceLocation,
        type,
        dimensions,
        entryPoints,
        hazards,
        ventilationRequired,
        permitRequired,
        safetyEquipment,
        inspectionNotes,
        status = 'active'
      } = req.body;

      const building = await Building.findOne({ _id: id, isActive: true });

      if (!building) {
        return res.status(404).json({
          success: false,
          error: 'Building not found',
          message: 'The requested building does not exist'
        });
      }

      const confinedSpaceData = {
        name,
        location: spaceLocation,
        type,
        dimensions,
        entryPoints: entryPoints || [],
        hazards: hazards || [],
        ventilationRequired,
        permitRequired,
        safetyEquipment: safetyEquipment || [],
        inspectionNotes,
        status
      };

      await building.addConfinedSpace(confinedSpaceData);

      res.json({
        success: true,
        data: { building },
        message: 'Confined space added successfully'
      });

    } catch (error) {
      console.error('Error in addConfinedSpace:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to add confined space'
      });
    }
  }

  // Remove confined space from building
  async removeConfinedSpace(req, res) {
    try {
      const { id, spaceId } = req.params;

      const building = await Building.findOne({ _id: id, isActive: true });

      if (!building) {
        return res.status(404).json({
          success: false,
          error: 'Building not found',
          message: 'The requested building does not exist'
        });
      }

      await building.removeConfinedSpace(spaceId);

      res.json({
        success: true,
        data: { building },
        message: 'Confined space removed successfully'
      });

    } catch (error) {
      console.error('Error in removeConfinedSpace:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to remove confined space'
      });
    }
  }

  // Get buildings with confined spaces
  async getBuildingsWithConfinedSpaces(req, res) {
    try {
      const buildings = await Building.findWithConfinedSpaces()
        .populate('locationId', 'name address')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: { buildings },
        message: 'Buildings with confined spaces retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getBuildingsWithConfinedSpaces:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve buildings with confined spaces'
      });
    }
  }

  // Get building statistics
  async getBuildingStats(req, res) {
    try {
      const stats = await Building.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalBuildings: { $sum: 1 },
            activeBuildings: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            inactiveBuildings: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
            },
            maintenanceBuildings: {
              $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
            },
            totalConfinedSpaces: {
              $sum: { $size: '$confinedSpaces' }
            },
            activeConfinedSpaces: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$confinedSpaces',
                    cond: { $eq: ['$$this.status', 'active'] }
                  }
                }
              }
            }
          }
        }
      ]);

      const buildingStats = stats[0] || {
        totalBuildings: 0,
        activeBuildings: 0,
        inactiveBuildings: 0,
        maintenanceBuildings: 0,
        totalConfinedSpaces: 0,
        activeConfinedSpaces: 0
      };

      res.json({
        success: true,
        data: buildingStats,
        message: 'Building statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getBuildingStats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve building statistics'
      });
    }
  }
}

// Validation middleware
export const validateBuilding = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Building name must be between 1 and 100 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Building code cannot exceed 50 characters'),
  body('locationId')
    .notEmpty()
    .isMongoId()
    .withMessage('Valid location ID is required'),
  body('specifications.buildingType')
    .isIn(['residential', 'office', 'retail', 'warehouse', 'manufacturing', 'mixed-use', 'parking'])
    .withMessage('Invalid building type'),
  body('specifications.totalFloors')
    .isInt({ min: 1 })
    .withMessage('Building must have at least 1 floor'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'under-construction', 'demolished'])
    .withMessage('Invalid status'),
];

export const validateConfinedSpace = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Confined space name is required'),
  body('type')
    .isIn(['tank', 'vessel', 'pipe', 'duct', 'tunnel', 'pit', 'vault', 'boiler', 'other'])
    .withMessage('Invalid confined space type'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'restricted', 'maintenance'])
    .withMessage('Invalid status'),
];

export default new BuildingController();