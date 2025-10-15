import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import activityRoutes from './routes/activity.js';
import { seedActivities } from './scripts/seedActivities.js';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for development environment or localhost
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip.includes('localhost');
    return isDev || isLocalhost;
  },
  keyGenerator: (req) => {
    // Use a more lenient key for localhost
    return req.ip === '127.0.0.1' || req.ip === '::1' ? 'localhost' : req.ip;
  }
});

// Apply rate limiting only to auth routes to be more specific
app.use('/api/auth', limiter);

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin')} - IP: ${req.ip}`);
  next();
});

// CORS configuration - More explicit for development
app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS check for origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin - allowing request');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      return callback(null, true);
    }
    
    // For development, allow any localhost origin
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('Localhost origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('Origin not allowed:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/activity', activityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  let message = 'Something went wrong';
  let statusCode = 500;

  if (error.name === 'ValidationError') {
    message = Object.values(error.errors).map(err => err.message).join(', ');
    statusCode = 400;
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 3001;

// Start server with database connection
const startServer = async () => {
  try {
    console.log('Starting auth service...');
    await connectDB();
    console.log('Database connected successfully');
    
    // Seed sample activities for development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(async () => {
        try {
          await seedActivities();
        } catch (seedError) {
          console.error('Error seeding activities:', seedError);
        }
      }, 2000); // Wait 2 seconds after server start
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Auth service running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Server listening on all interfaces (0.0.0.0:${PORT})`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
