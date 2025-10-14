import jwt from 'jsonwebtoken';
import axios from 'axios';

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    try {
      // Verify token
      const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production';
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Add user info to request
      req.user = {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName,
        lastName: decoded.lastName
      };

      next();
    } catch (jwtError) {
      // If JWT verification fails, try to validate with auth service
      try {
        const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
        const response = await axios.get(`${authServiceUrl}/api/auth/verify`, {
          headers: {
            Authorization: authHeader
          }
        });

        if (response.data.success && response.data.data.user) {
          req.user = response.data.data.user;
          next();
        } else {
          throw new Error('Invalid token response');
        }
      } catch (serviceError) {
        console.error('Token validation failed:', jwtError.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Please log in again'
        });
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error',
      message: 'Failed to authenticate user'
    });
  }
};

// Role-based access control middleware
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in first'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access forbidden',
        message: `This operation requires one of these roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Admin only access
export const adminOnly = authorize('admin');

// Admin and Manager access
export const adminAndManager = authorize('admin', 'manager');

// Admin, Manager, and Technician access
export const adminManagerTechnician = authorize('admin', 'manager', 'technician');

// Any authenticated user
export const authenticated = authenticate;

export default {
  authenticate,
  authorize,
  adminOnly,
  adminAndManager,
  adminManagerTechnician,
  authenticated
};