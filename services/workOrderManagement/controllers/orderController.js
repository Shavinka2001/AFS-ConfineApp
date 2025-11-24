const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Helper functions for CSV parsing
function validatePriority(priority) {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  return validPriorities.includes(priority?.toLowerCase()) ? priority.toLowerCase() : null;
}

function validateStatus(status) {
  const validStatuses = ['draft', 'pending', 'approved', 'in-progress', 'completed', 'cancelled', 'on-hold'];
  return validStatuses.includes(status?.toLowerCase()) ? status.toLowerCase() : null;
}



function parseDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['yes', 'true', '1', 'y'].includes(value.toLowerCase());
  }
  return false;
}

class OrderController {
  // Get all orders for a user with filtering and pagination
  async getOrders(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        priority, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        search,
        dateFrom,
        dateTo
      } = req.query;

      const userId = req.user.id;
      const userRole = req.user.role;
      const skip = (page - 1) * limit;

      // Build query - admins can see all orders, managers can see all orders, technicians see assigned orders, others see their own
      const query = {};
      if (userRole === 'admin') {
        // Admins see all orders
        console.log('Admin user accessing all work orders');
      } else if (userRole === 'manager') {
        // Managers should see all work orders
        console.log('Manager user accessing all work orders');
      } else if (userRole === 'technician') {
        // Technicians see orders assigned to them by name
        // Try multiple patterns to match the technician name
        const firstName = req.user.firstName || '';
        const lastName = req.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log(`Technician ${fullName} accessing their work orders`);
        
        query.$or = query.$or || [];
        query.$or.push(
          { technician: { $regex: new RegExp(fullName, 'i') } },
          { technician: { $regex: new RegExp(`${lastName}, ${firstName}`, 'i') } },
          { technician: { $regex: new RegExp(`${lastName} ${firstName}`, 'i') } },
          { technician: { $regex: new RegExp(firstName, 'i') } }
        );
      } else {
        // Regular users see only their own orders
        console.log(`Regular user ${userId} accessing their work orders`);
        query.userId = userId;
      }
      
      if (priority) query.priority = priority;
      
      if (search) {
        query.$or = [
          { spaceName: { $regex: search, $options: 'i' } },
          { building: { $regex: search, $options: 'i' } },
          { locationDescription: { $regex: search, $options: 'i' } },
          { technician: { $regex: search, $options: 'i' } },
          { uniqueId: { $regex: search, $options: 'i' } },
          { confinedSpaceNameOrId: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (dateFrom || dateTo) {
        query.surveyDate = {};
        if (dateFrom) query.surveyDate.$gte = new Date(dateFrom);
        if (dateTo) query.surveyDate.$lte = new Date(dateTo);
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [orders, total] = await Promise.all([
        Order.find(query)
          .sort(sort)
          .skip(parseInt(skip))
          .limit(parseInt(limit))
          .lean(),
        Order.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch work orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get single order by ID
  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Build query - admins can view any order, technicians can view orders assigned to them, others only their own
      const query = {
        $or: [
          { _id: id },
          { uniqueId: id },
          { internalId: id }
        ]
      };
      
      if (userRole === 'admin') {
        // Admins can view any order
      } else if (userRole === 'technician') {
        // Technicians can view orders assigned to them
        const firstName = req.user.firstName || '';
        const lastName = req.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        query.$or = [
          ...query.$or,
          { technician: { $regex: new RegExp(fullName, 'i') } },
          { technician: { $regex: new RegExp(`${lastName}, ${firstName}`, 'i') } },
          { technician: { $regex: new RegExp(`${lastName} ${firstName}`, 'i') } },
          { technician: { $regex: new RegExp(firstName, 'i') } }
        ];
      } else {
        // Regular users can only view their own orders
        query.userId = userId;
      }

      const order = await Order.findOne(query);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch work order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Create new work order
  async createOrder(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const orderData = {
        ...req.body,
        userId,
        createdBy: userId,
        lastModifiedBy: userId
      };

      // Convert null boolean values to false for required fields
      const booleanFields = [
        'isConfinedSpace',
        'permitRequired', 
        'atmosphericHazard',
        'engulfmentHazard',
        'configurationHazard',
        'otherRecognizedHazards',
        'ppeRequired',
        'forcedAirVentilationSufficient',
        'dedicatedAirMonitor',
        'warningSignPosted',
        'otherPeopleWorkingNearSpace',
        'canOthersSeeIntoSpace',
        'contractorsEnterSpace'
      ];

      booleanFields.forEach(field => {
        if (orderData[field] === null || orderData[field] === undefined) {
          orderData[field] = false;
        }
      });

      // Add initial workflow entry
      orderData.workflowHistory = [{
        action: 'created',
        performedBy: userId,
        timestamp: new Date(),
        comments: 'Work order created'
      }];

      const order = new Order(orderData);
      await order.save();

      res.status(201).json({
        success: true,
        message: 'Work order created successfully',
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create work order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update work order
  async updateOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const updateData = {
        ...req.body,
        lastModifiedBy: userId
      };

      // Build query - admins can update any order, technicians can update orders assigned to them, others only their own
      let query;
      
      if (userRole === 'admin') {
        // Admins can update any order
        query = {
          $or: [
            { _id: id },
            { uniqueId: id },
            { internalId: id }
          ]
        };
      } else if (userRole === 'technician') {
        // Technicians can update orders assigned to them
        const firstName = req.user.firstName || '';
        const lastName = req.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        query = {
          $and: [
            {
              $or: [
                { _id: id },
                { uniqueId: id },
                { internalId: id }
              ]
            },
            {
              $or: [
                { technician: { $regex: new RegExp(fullName, 'i') } },
                { technician: { $regex: new RegExp(`${lastName}, ${firstName}`, 'i') } },
                { technician: { $regex: new RegExp(`${lastName} ${firstName}`, 'i') } },
                { technician: { $regex: new RegExp(firstName, 'i') } }
              ]
            }
          ]
        };
      } else {
        // Regular users can only update their own orders
        query = {
          $and: [
            {
              $or: [
                { _id: id },
                { uniqueId: id },
                { internalId: id }
              ]
            },
            { userId: userId }
          ]
        };
      }

      const order = await Order.findOne(query);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found'
        });
      }

      // Check if status transition is valid
      if (updateData.status && updateData.status !== order.status) {
        if (!order.canTransitionTo(updateData.status)) {
          return res.status(400).json({
            success: false,
            message: `Cannot transition from ${order.status} to ${updateData.status}`
          });
        }
      }

      Object.assign(order, updateData);
      await order.save();

      res.json({
        success: true,
        message: 'Work order updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Error updating order:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update work order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Delete work order
  async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Build query - admins can delete any order, technicians can delete orders assigned to them, others only their own
      let query;
      
      if (userRole === 'admin') {
        // Admins can delete any order
        query = {
          $or: [
            { _id: id },
            { uniqueId: id },
            { internalId: id }
          ]
        };
      } else if (userRole === 'technician') {
        // Technicians can delete orders assigned to them
        const firstName = req.user.firstName || '';
        const lastName = req.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        query = {
          $and: [
            {
              $or: [
                { _id: id },
                { uniqueId: id },
                { internalId: id }
              ]
            },
            {
              $or: [
                { technician: { $regex: new RegExp(fullName, 'i') } },
                { technician: { $regex: new RegExp(`${lastName}, ${firstName}`, 'i') } },
                { technician: { $regex: new RegExp(`${lastName} ${firstName}`, 'i') } },
                { technician: { $regex: new RegExp(firstName, 'i') } }
              ]
            }
          ]
        };
      } else {
        // Regular users can only delete their own orders
        query = {
          $and: [
            {
              $or: [
                { _id: id },
                { uniqueId: id },
                { internalId: id }
              ]
            },
            { userId: userId }
          ]
        };
      }

      const order = await Order.findOneAndDelete(query);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found'
        });
      }

      res.json({
        success: true,
        message: 'Work order deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete work order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      const [statusStats, priorityStats, recentActivity] = await Promise.all([
        Order.getStatsByUser(userId),
        Order.aggregate([
          { $match: { userId } },
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        Order.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('uniqueId status priority dateOfSurvey confinedSpaceNameOrId building')
          .lean()
      ]);

      const today = moment().startOf('day');
      const thisWeek = moment().startOf('week');
      const thisMonth = moment().startOf('month');

      const [todayCount, weekCount, monthCount] = await Promise.all([
        Order.countDocuments({ 
          userId, 
          createdAt: { $gte: today.toDate() } 
        }),
        Order.countDocuments({ 
          userId, 
          createdAt: { $gte: thisWeek.toDate() } 
        }),
        Order.countDocuments({ 
          userId, 
          createdAt: { $gte: thisMonth.toDate() } 
        })
      ]);

      res.json({
        success: true,
        data: {
          statusDistribution: statusStats,
          priorityDistribution: priorityStats,
          recentActivity,
          counters: {
            today: todayCount,
            thisWeek: weekCount,
            thisMonth: monthCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Update order status
  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      // Build query - admins can update any order, technicians can update orders assigned to them, others only their own
      let query;
      
      if (userRole === 'admin') {
        // Admins can update any order
        query = {
          $or: [
            { _id: id },
            { uniqueId: id },
            { internalId: id }
          ]
        };
      } else if (userRole === 'technician') {
        // Technicians can update orders assigned to them
        const firstName = req.user.firstName || '';
        const lastName = req.user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        query = {
          $and: [
            {
              $or: [
                { _id: id },
                { uniqueId: id },
                { internalId: id }
              ]
            },
            {
              $or: [
                { technician: { $regex: new RegExp(fullName, 'i') } },
                { technician: { $regex: new RegExp(`${lastName}, ${firstName}`, 'i') } },
                { technician: { $regex: new RegExp(`${lastName} ${firstName}`, 'i') } },
                { technician: { $regex: new RegExp(firstName, 'i') } }
              ]
            }
          ]
        };
      } else {
        // Regular users can only update their own orders
        query = {
          $and: [
            {
              $or: [
                { _id: id },
                { uniqueId: id },
                { internalId: id }
              ]
            },
            { userId: userId }
          ]
        };
      }
      
      const order = await Order.findOne(query);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Work order not found'
        });
      }

      // Check if status transition is valid
      if (!order.canTransitionTo(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${order.status} to ${status}`
        });
      }

      const previousStatus = order.status;
      order.status = status;
      order.lastModifiedBy = userId;

      // Add workflow entry
      order.workflowHistory.push({
        action: 'status_change',
        performedBy: userId,
        timestamp: new Date(),
        comments: comments || `Status changed from ${previousStatus} to ${status}`,
        previousStatus,
        newStatus: status
      });

      await order.save();

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: order
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Bulk operations
  async bulkUpdateStatus(req, res) {
    try {
      const { orderIds, status, comments } = req.body;
      const userId = req.user.id;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order IDs array is required'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const orders = await Order.find({
        _id: { $in: orderIds },
        $or: [
          { userId }, // Orders created by the user
          ...(userRole === 'technician' ? [
            { technician: { $regex: new RegExp(`${req.user.firstName}.*${req.user.lastName}`, 'i') } }
          ] : []) // Orders assigned to the technician
        ]
      });

      if (orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No work orders found'
        });
      }

      const updatePromises = orders.map(async (order) => {
        if (order.canTransitionTo(status)) {
          const previousStatus = order.status;
          order.status = status;
          order.lastModifiedBy = userId;
          
          order.workflowHistory.push({
            action: 'bulk_status_change',
            performedBy: userId,
            timestamp: new Date(),
            comments: comments || `Bulk status change from ${previousStatus} to ${status}`,
            previousStatus,
            newStatus: status
          });
          
          return order.save();
        }
        return null;
      });

      const results = await Promise.all(updatePromises);
      const updatedCount = results.filter(r => r !== null).length;

      res.json({
        success: true,
        message: `${updatedCount} work orders updated successfully`,
        data: {
          totalRequested: orderIds.length,
          updated: updatedCount,
          skipped: orderIds.length - updatedCount
        }
      });
    } catch (error) {
      console.error('Error in bulk update:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk update',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Delete all orders (Admin/Manager only)
  async deleteAllOrders(req, res) {
    try {
      const { confirmPhrase } = req.body;
      const userRole = req.user.role;
      
      // Security check: Only admin and manager can delete all orders
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only administrators and managers can delete all work orders.'
        });
      }

      // Verify confirmation phrase
      const requiredPhrase = 'DELETE ALL WORK ORDERS';
      if (!confirmPhrase || confirmPhrase.trim().toUpperCase() !== requiredPhrase) {
        return res.status(400).json({
          success: false,
          message: `Confirmation phrase required. Please type "${requiredPhrase}" exactly to confirm.`
        });
      }

      console.log(`${userRole} ${req.user.firstName} ${req.user.lastName} is attempting to delete all work orders`);

      // Get count before deletion for logging
      const countBeforeDeletion = await Order.countDocuments({});
      
      if (countBeforeDeletion === 0) {
        return res.json({
          success: true,
          message: 'No work orders to delete.',
          data: {
            deletedCount: 0,
            totalBefore: 0
          }
        });
      }

      // Perform the deletion
      const deleteResult = await Order.deleteMany({});
      
      console.log(`Successfully deleted ${deleteResult.deletedCount} work orders by ${userRole} ${req.user.firstName} ${req.user.lastName}`);
      
      res.json({
        success: true,
        message: `Successfully deleted all ${deleteResult.deletedCount} work orders.`,
        data: {
          deletedCount: deleteResult.deletedCount,
          totalBefore: countBeforeDeletion,
          deletedBy: {
            role: userRole,
            name: `${req.user.firstName} ${req.user.lastName}`,
            email: req.user.email
          },
          deletedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error deleting all orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete all work orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Bulk import orders from CSV data
  async bulkImportOrders(req, res) {
    try {
      const { csvData } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Check permissions
      if (!['admin', 'manager'].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Only admins and managers can bulk import work orders'
        });
      }

      if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No CSV data provided'
        });
      }

      console.log(`User ${userId} (${userRole}) importing ${csvData.length} work orders`);
      console.log('Sample CSV data:', csvData[0]); // Log first row for debugging

      const results = {
        total: csvData.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      const successfulOrders = [];

      // Process each row
      for (let i = 0; i < csvData.length; i++) {
        try {
          const row = csvData[i];
          console.log(`Processing row ${i + 1}:`, row);
          
          // Validate that required fields are not empty
          if (!row.spaceName || row.spaceName.trim() === '') {
            throw new Error(`Row ${i + 1}: Space Name is required and cannot be empty`);
          }
          if (!row.building || row.building.trim() === '') {
            throw new Error(`Row ${i + 1}: Building is required and cannot be empty`);
          }
          if (!row.technician || row.technician.trim() === '') {
            throw new Error(`Row ${i + 1}: Technician is required and cannot be empty`);
          }
          
          // Map CSV fields to order object
          const orderData = {
            userId: userId,
            createdBy: userId,
            workOrderId: row.workOrderId || undefined, // Let the system generate if empty
            spaceName: row.spaceName || '',
            building: row.building || '',
            locationDescription: row.locationDescription || '',
            confinedSpaceDescription: row.confinedSpaceDescription || '',
            technician: row.technician || '',
            priority: validatePriority(row.priority) || 'medium',
            status: validateStatus(row.status) || 'draft',
            surveyDate: parseDate(row.surveyDate) || new Date(),
            
            // Space Classification
            isConfinedSpace: parseBoolean(row.isConfinedSpace),
            permitRequired: parseBoolean(row.permitRequired),
            entryRequirements: row.entryRequirements || '',
            
            // Hazard Assessment
            atmosphericHazard: parseBoolean(row.atmosphericHazard),
            atmosphericHazardDescription: row.atmosphericHazardDescription || '',
            engulfmentHazard: parseBoolean(row.engulfmentHazard),
            engulfmentHazardDescription: row.engulfmentHazardDescription || '',
            configurationHazard: parseBoolean(row.configurationHazard),
            configurationHazardDescription: row.configurationHazardDescription || '',
            otherRecognizedHazards: parseBoolean(row.otherRecognizedHazards),
            otherHazardsDescription: row.otherHazardsDescription || '',
            
            // Safety Requirements
            ppeRequired: parseBoolean(row.ppeRequired),
            ppeList: row.ppeList || '',
            forcedAirVentilationSufficient: parseBoolean(row.forcedAirVentilationSufficient),
            dedicatedAirMonitor: parseBoolean(row.dedicatedAirMonitor),
            warningSignPosted: parseBoolean(row.warningSignPosted),
            
            // Entry Points and Access
            numberOfEntryPoints: row.numberOfEntryPoints ? Math.min(parseInt(row.numberOfEntryPoints) || 0, 20) : undefined,
            
            // Personnel and Access
            otherPeopleWorkingNearSpace: parseBoolean(row.otherPeopleWorkingNearSpace),
            canOthersSeeIntoSpace: parseBoolean(row.canOthersSeeIntoSpace),
            contractorsEnterSpace: parseBoolean(row.contractorsEnterSpace),
            
            // Additional Information
            notes: row.notes || '',
            
            // Parse images if provided
            imageUrls: row.images ? row.images.split(';').map(url => url.trim()).filter(url => url) : []
          };

          console.log(`Mapped order data for row ${i + 1}:`, orderData);

          // Validate required fields
          if (!orderData.spaceName || !orderData.building || !orderData.technician) {
            throw new Error(`Row ${i + 1}: Missing required fields (spaceName, building, or technician)`);
          }

          // Create the order
          const order = new Order(orderData);
          const savedOrder = await order.save();
          console.log(`Successfully saved order ${i + 1}:`, savedOrder.workOrderId);
          
          successfulOrders.push(savedOrder);
          results.successful++;

        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            error: error.message
          });
          console.error(`Error importing row ${i + 1}:`, error.message);
        }
      }

      console.log(`Bulk import completed: ${results.successful} successful, ${results.failed} failed`);

      res.status(200).json({
        success: true,
        message: `Bulk import completed: ${results.successful} orders imported successfully, ${results.failed} failed`,
        data: {
          results,
          importedOrders: successfulOrders.map(order => ({
            id: order._id,
            workOrderId: order.workOrderId,
            spaceName: order.spaceName,
            building: order.building,
            status: order.status
          }))
        }
      });

    } catch (error) {
      console.error('Error in bulk import:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import work orders',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new OrderController();