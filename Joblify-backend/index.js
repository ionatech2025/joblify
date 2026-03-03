import { checkDatabaseHealth } from './config/db.mjs';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import session from 'express-session';
import prisma from './lib/prisma.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CORS CONFIGURATION
// ==========================================

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3001",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://yourdomain.com", // Add your production domain
      "https://www.yourdomain.com" // Add your production domain
    ];

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log but allow the request
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  CORS warning - allowing origin in development:', origin);
        callback(null, true);
      } else {
        console.log('🚫 Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: [
    'Set-Cookie',
    'Authorization',
    'Content-Length',
    'X-Request-ID'
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests globally
app.options('*', cors());

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'joblify-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  },
  store: process.env.NODE_ENV === 'production' 
    ? /* your production session store */ null 
    : undefined
}));

// ==========================================
// REQUEST LOGGING MIDDLEWARE
// ==========================================

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Origin:', req.headers.origin);
  console.log('User-Agent:', req.headers['user-agent']);
  next();
});

// ==========================================
// ROUTES
// ==========================================

// Import routes
import authRouter from './routes/auth.route.mjs';
import jobseekerRouter from './routes/jobseeker.route.mjs';
import companyRouter from './routes/company.route.mjs';

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/jobseeker', jobseekerRouter);
app.use('/api/company', companyRouter);

// ==========================================
// HEALTH CHECK & BASIC ROUTES
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'Joblify API',
    version: '1.0.0',
    cors: {
      origin: req.headers.origin,
      allowed: true
    }
  });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working correctly!',
    origin: req.headers.origin,
    credentials: true,
    timestamp: new Date().toISOString()
  });
});

// Database health check
app.get('/api/db-health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      ...dbHealth,
      cors: {
        origin: req.headers.origin,
        allowed: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error.message,
      cors: {
        origin: req.headers.origin,
        allowed: true
      }
    });
  }
});

// Session test endpoint
app.get('/api/session-test', (req, res) => {
  if (!req.session.views) {
    req.session.views = 1;
  } else {
    req.session.views++;
  }
  
  res.json({
    success: true,
    message: 'Session test successful',
    sessionId: req.sessionID,
    views: req.session.views,
    origin: req.headers.origin
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Origin not allowed',
      origin: req.headers.origin,
      allowedOrigins: [
        process.env.CLIENT_URL || "http://localhost:3001",
        "http://localhost:3000",
        "http://localhost:3001"
      ]
    });
  }
  next(err);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Prisma errors
  if (error.code?.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Database error occurred',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.message
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 CORS test: http://localhost:${PORT}/api/cors-test`);
  console.log(`📍 DB Health: http://localhost:${PORT}/api/db-health`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS Enabled for:`);
  console.log(`   - ${process.env.CLIENT_URL || "http://localhost:3001"}`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - http://127.0.0.1:3000`);
  console.log(`   - http://localhost:3001`);
  console.log(`   - http://127.0.0.1:3001`);
  console.log(`\n📋 Server ready to accept requests!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;