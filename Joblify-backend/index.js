import { checkDatabaseHealth } from './config/db.mjs';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import session from 'express-session';
import prisma from './lib/prisma.mjs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. CORS CONFIGURATION
// ==========================================
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.CLIENT_URL,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://localhost:5173", // Common Vite port
    ].filter(Boolean);

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
// 2. MIDDLEWARE
// ==========================================
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
// 3. PRIMARY SYSTEM ROUTES (Fixed Positioning)
// ==========================================


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Joblify API is live",
    version: "2.1.0",
    status: "Service Operational"
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
    res.json({
      success: true,
      ...dbHealth
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. API BUSINESS ROUTES
// ==========================================
import authRouter from './routes/auth.route.mjs';
import jobseekerRouter from './routes/jobseeker.route.mjs';
import companyRouter from './routes/company.route.mjs';

app.use('/api/auth', authRouter);
app.use('/api/jobseeker', jobseekerRouter);
app.use('/api/company', companyRouter);

// ==========================================
// 5. ERROR HANDLING (Must be LAST)
// ==========================================

// 404 handler for any undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global internal error handler
app.use((error, req, res, next) => {
  console.error('CRITICAL ERROR:', error);
  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ==========================================
// 6. SERVER STARTUP
// ==========================================
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Joblify Server running on port ${PORT}`);
  console.log(`🔗 Local Access: http://localhost:${PORT}/`);
  console.log(`🛠️ Mode: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown logic
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server connections closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;