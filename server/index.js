const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const { startCronJobs } = require('./services/cronScheduler');

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('⚠️  CRITICAL: Missing required environment variables:', missingEnvVars);
  console.error('Please set these in your .env file or Render dashboard');
  process.exit(1);
}

console.log('✅ Environment variables validated');

// Connect to database
connectDB();

// Initialize chron jobs
startCronJobs();

const app = express();

// Trust proxy - required for rate limiting to work properly on hosted services like Render
app.set('trust proxy', 1);

const helmet = require('helmet');

// Use Helmet for basic security headers
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:5173"
  ],
  credentials: true
}));

// Parse JSON completely BEFORE any other stream-reliant middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Resilient parser for auth endpoints: accept JSON payloads even if content-type is missing or text/plain.
app.use('/api/auth', express.json({
  type: (req) => {
    const contentType = req.headers['content-type'] || '';
    return (
      !contentType ||
      contentType.includes('application/json') ||
      contentType.includes('application/*+json') ||
      contentType.includes('text/plain')
    );
  },
}));

// Temporary auth diagnostics: verifies incoming content-type and parsed body shape.
app.use('/api/auth', (req, res, next) => {
  const bodyKeys = req.body && typeof req.body === 'object' ? Object.keys(req.body) : [];
  console.log('[AUTH_DEBUG]', {
    method: req.method,
    path: req.path,
    contentType: req.headers['content-type'] || null,
    hasBody: bodyKeys.length > 0,
    bodyKeys,
  });
  next();
});

// Apply rate limiting to all API requests
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
      // Skip rate limiting for health check
      return req.path === '/';
    }
});
app.use('/api', apiLimiter);

// Basic route so visiting the backend URL in a browser doesn't show a 404 error
app.get('/', (req, res) => {
    res.send('Competition App API is running and healthy!');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/weeks', require('./routes/weekRoutes'));

// Custom Error Handler so the frontend can read the exact backend crash reason
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
});
