const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  createOrderValidation,
  updateOrderValidation,
  orderIdValidation,
  statusUpdateValidation,
  queryValidation,
  bulkUpdateValidation
} = require('../middleware/validation');

// GET /api/orders/proxy-image - Proxy images to bypass CORS (no auth required)
router.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }
    
    // Validate that it's an Azure blob URL (security check)
    if (!url.includes('afsconfined.blob.core.windows.net')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL'
      });
    }
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'max-age=3600');
    res.send(buffer);
    
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load image'
    });
  }
});

// Test endpoint without auth for debugging
router.get('/test', async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({}).limit(5);
    res.json({
      success: true,
      message: 'Test endpoint working',
      data: {
        orders: orders,
        count: orders.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
});

// Apply auth middleware to all other routes
router.use(authMiddleware);

// GET /api/orders - Get all orders with filtering and pagination
router.get('/', 
  queryValidation,
  asyncHandler(orderController.getOrders)
);

// GET /api/orders/stats - Get user statistics
router.get('/stats', 
  asyncHandler(orderController.getUserStats)
);

// GET /api/orders/:id - Get single order
router.get('/:id', 
  orderIdValidation,
  asyncHandler(orderController.getOrderById)
);

// POST /api/orders - Create new order
router.post('/', 
  createOrderValidation,
  asyncHandler(orderController.createOrder)
);

// PUT /api/orders/:id - Update order
router.put('/:id', 
  orderIdValidation,
  updateOrderValidation,
  asyncHandler(orderController.updateOrder)
);

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', 
  orderIdValidation,
  statusUpdateValidation,
  asyncHandler(orderController.updateOrderStatus)
);

// POST /api/orders/bulk/status - Bulk update status
router.post('/bulk/status', 
  bulkUpdateValidation,
  asyncHandler(orderController.bulkUpdateStatus)
);

// DELETE /api/orders/:id - Delete order
router.delete('/:id', 
  orderIdValidation,
  asyncHandler(orderController.deleteOrder)
);

module.exports = router;