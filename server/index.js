const express = require('express');
const colors = require('colors');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');

const { startCronJobs } = require('./services/cronScheduler');

// Connect to database
connectDB();

// Initialize chron jobs
startCronJobs();

const app = express();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Use Helmet for basic security headers
app.use(helmet());

// Apply rate limiting to all API requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false, 
});
app.use('/api', apiLimiter);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

app.listen(port, () => console.log(`Server started on port ${port}`));
