const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('Auth middleware: Token decoded successfully');
    console.log('Decoded token:', decoded);
    
    // Add user info to request from JWT payload
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };

    console.log('Auth middleware: User set in request:', req.user);
    console.log('Auth middleware: User role type:', typeof req.user.role);
    console.log('Auth middleware: User role value:', JSON.stringify(req.user.role));

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('Auth middleware: No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    console.log('Auth middleware: Checking role authorization');
    console.log('User object:', req.user);
    console.log('User role:', req.user.role);
    console.log('User role type:', typeof req.user.role);
    console.log('Required roles:', roles);
    console.log('Required roles types:', roles.map(r => typeof r));
    
    // Ensure both role and required roles are strings and trimmed
    const userRole = String(req.user.role || '').trim().toLowerCase();
    const normalizedRequiredRoles = roles.map(role => String(role || '').trim().toLowerCase());
    
    console.log('Normalized user role:', userRole);
    console.log('Normalized required roles:', normalizedRequiredRoles);
    
    const hasPermission = normalizedRequiredRoles.includes(userRole);
    console.log('Role check result:', hasPermission);

    if (!req.user.role || !hasPermission) {
      console.log('Auth middleware: User not authorized for roles:', roles);
      console.log('Auth middleware: User has role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role || 'none'}' is not authorized for this resource. Required roles: ${roles.join(', ')}`
      });
    }

    console.log('Auth middleware: User authorized');
    next();
  };
};

module.exports = authMiddleware;
module.exports.authorize = authorize;
module.exports.requireAuth = authMiddleware;
module.exports.requireRole = authorize;