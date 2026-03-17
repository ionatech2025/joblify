// v2 test
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
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL, // Your Render Frontend URL (Set this in Render Env Vars)
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001"
    ].filter(Boolean); // Removes undefined values if CLIENT_URL isn't set yet

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

// ==========================================
// MIDDLEWARE
// ==========================================

// Use express's built-in parsers (no need for extra body-parser calls)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'joblify-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// ROUTES
// ==========================================

import authRouter from './routes/auth.route.mjs';
import jobseekerRouter from './routes/jobseeker.route.mjs';
import companyRouter from './routes/company.route.mjs';

app.use('/api/auth', authRouter);
app.use('/api/jobseeker', jobseekerRouter);
app.use('/api/company', companyRouter);

// ==========================================
// FIXED: ROOT ROUTE (Fixes the "Route / not found" error)
// ==========================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Joblify API is live",
    documentation: "/api/health"
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// DB health check
app.get('/api/db-health', async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    res.json(dbHealth);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

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
  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ==========================================
// SERVER STARTUP
// ==========================================

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🔗 Root: http://localhost:${PORT}/`);
});

// Graceful shutdown
const shutdown = () => {
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;