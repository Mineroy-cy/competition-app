const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { normalizeDailyStreak } = require('../services/dailyStreakService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { username, email, password } = body;

  console.log('Registration attempt:', { username, email });

  if (Object.keys(body).length === 0) {
    res.status(400);
    throw new Error('Request body is missing. Ensure Content-Type is application/json and JSON payload is sent.');
  }

  const missingFields = [];
  if (!username || !String(username).trim()) missingFields.push('username');
  if (!email || !String(email).trim()) missingFields.push('email');
  if (!password || !String(password).trim()) missingFields.push('password');

  if (missingFields.length > 0) {
    res.status(400);
    throw new Error(`Missing required field(s): ${missingFields.join(', ')}`);
  }

  // Check if user exists
  const userExists = await User.findOne({ 
    $or: [{ email }, { username }]
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  console.log('Creating user in database...');
  try {
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    console.log('User created successfully:', user._id);

    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    console.error('Error creating user:', error.message);
    console.error('Full error:', error);
    res.status(400);
    throw new Error(`Failed to create user: ${error.message}`);
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  // Check for user email
  let user = await User.findOne({ email });

  if (user) {
    await normalizeDailyStreak(user._id);
    user = await User.findById(user._id);
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      profilePhoto: user.profilePhoto,
      totalCompletedWeeks: user.totalCompletedWeeks,
      currentStreak: user.currentStreak,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  await normalizeDailyStreak(req.user.id);
  const freshUser = await User.findById(req.user.id).select('-password');
  res.status(200).json(freshUser);
});

// Generate JWT
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
