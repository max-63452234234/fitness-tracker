// PostgreSQL Server for Fitness Tracker
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

// Environment variables
const port = process.env.PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_change_this';
const jwtExpiry = process.env.JWT_EXPIRY || '24h';
const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
const nodeEnv = process.env.NODE_ENV || 'development';

// Create Express app
const app = express();

// Security middlewares
app.use(helmet()); // Set security HTTP headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/auth/', limiter); // Apply rate limiting to auth routes

// General middlewares
app.use(compression()); // Compress all responses
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev')); // Logging
app.use(cors({
  origin: nodeEnv === 'production' ? 'https://yourdomain.com' : true,
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

// First connect to PostgreSQL without specifying a database
const pgConfig = {
  host: process.env.DB_HOST || '192.168.2.127',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'IloveJanu1!'
};

// Create a client to connect to the default database
const client = new Pool(pgConfig);

// Function to create the database if it doesn't exist
async function createDatabaseIfNotExists() {
  try {
    // Connect to the default database
    await client.connect();
    
    // Check if our database exists
    const dbName = process.env.DB_NAME || 'fitness_tracker';
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    
    // If database doesn't exist, create it
    if (result.rows.length === 0) {
      console.log(`Database ${dbName} does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
    
    // Close the client
    await client.end();
    
    return true;
  } catch (error) {
    console.error('Error creating database:', error);
    return false;
  }
}

// PostgreSQL connection pool for the application database
const pool = new Pool({
  host: process.env.DB_HOST || '192.168.2.127',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fitness_tracker',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'IloveJanu1!'
});

// Initialize database tables
async function initDatabase() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL database');
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create workouts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        type VARCHAR(50) NOT NULL,
        duration INTEGER NOT NULL,
        intensity VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        target_value NUMERIC NOT NULL,
        current_value NUMERIC DEFAULT 0,
        unit VARCHAR(50),
        category VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        target_date DATE,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create body measurements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS measurements (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        weight NUMERIC,
        height NUMERIC,
        body_fat NUMERIC,
        chest NUMERIC,
        waist NUMERIC,
        hips NUMERIC,
        arms NUMERIC,
        thighs NUMERIC,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create habits table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        frequency VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create habit logs table to track daily habit completion
    await pool.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER REFERENCES habits(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(habit_id, date)
      )
    `);
    
    console.log('Database tables initialized');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Initialize database on startup
(async function() {
  try {
    // First create the database if it doesn't exist
    const dbCreated = await createDatabaseIfNotExists();
    if (dbCreated) {
      // Then initialize the tables
      await initDatabase();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
})();

// Auth helpers
function generateToken(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiry });
}

function generateRefreshToken(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: refreshTokenExpiry });
}

// Auth middleware
function authenticateToken(req, res, next) {
  // Get token from Authorization header or cookies
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    req.user = user;
    next();
  });
}

// Create refresh tokens table if it doesn't exist
async function createRefreshTokensTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);
    console.log('Refresh tokens table initialized');
    return true;
  } catch (error) {
    console.error('Error creating refresh tokens table:', error);
    return false;
  }
}

// Initialize refresh tokens table
(async function() {
  try {
    await createRefreshTokensTable();
  } catch (error) {
    console.error('Refresh tokens table initialization failed:', error);
  }
})();

// API Routes

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }
  
  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ 
      success: false, 
      error: 'Password must be at least 8 characters long' 
    });
  }
  
  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    
    const userId = result.rows[0].id;
    
    // Generate JWT token
    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);
    
    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, refreshToken, expiresAt]
    );
    
    // Set cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(201).json({ 
      success: true, 
      userId, 
      token,
      expiresIn: jwtExpiry 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }
  
  try {
    // Get user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    
    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );
    
    // Set cookies
    res.cookie('token', token, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ 
      success: true, 
      userId: user.id, 
      token, 
      expiresIn: jwtExpiry 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ success: false, error: 'Refresh token required' });
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtSecret);
    
    // Check if token exists in database
    const tokenResult = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [decoded.id, refreshToken]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newToken = generateToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);
    
    // Update refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    await pool.query(
      'UPDATE refresh_tokens SET token = $1, expires_at = $2 WHERE user_id = $3 AND token = $4',
      [newRefreshToken, expiresAt, decoded.id, refreshToken]
    );
    
    // Set cookies
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: nodeEnv === 'production',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ 
      success: true, 
      userId: decoded.id, 
      token: newToken, 
      expiresIn: jwtExpiry 
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(403).json({ success: false, error: 'Invalid refresh token' });
  }
});

// Logout user
app.post('/api/auth/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  // Clear cookies regardless
  res.clearCookie('token');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  
  // If refresh token exists, remove it from database
  if (refreshToken) {
    try {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    } catch (error) {
      console.error('Error removing refresh token:', error);
      // Continue with logout regardless
    }
  }
  
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user's workouts
app.get('/api/workouts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM workouts WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    
    // Format workouts to match client expectations
    const workouts = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      type: row.type,
      duration: row.duration,
      intensity: row.intensity,
      notes: row.notes,
      timestamp: row.created_at
    }));
    
    res.json({ success: true, workouts });
  } catch (error) {
    console.error('Error getting workouts:', error);
    res.status(500).json({ success: false, error: 'Failed to get workouts' });
  }
});

// Add a new workout
app.post('/api/workouts', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { date, type, duration, intensity, notes } = req.body;
  
  if (!date || !type || !duration || !intensity) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID, date, type, duration, and intensity are required' 
    });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO workouts (user_id, date, type, duration, intensity, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [userId, date, type, duration, intensity, notes]
    );
    
    const workoutId = result.rows[0].id;
    
    res.status(201).json({ success: true, workoutId });
  } catch (error) {
    console.error('Error adding workout:', error);
    res.status(500).json({ success: false, error: 'Failed to add workout' });
  }
});

// Delete a workout
app.delete('/api/workouts/:id', authenticateToken, async (req, res) => {
  const workoutId = req.params.id;
  const userId = req.user.id;
  
  if (!workoutId) {
    return res.status(400).json({ success: false, error: 'Workout ID and User ID are required' });
  }
  
  try {
    // Verify workout belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM workouts WHERE id = $1 AND user_id = $2',
      [workoutId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Workout not found' });
    }
    
    // Delete workout
    await pool.query('DELETE FROM workouts WHERE id = $1', [workoutId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({ success: false, error: 'Failed to delete workout' });
  }
});

// Goals API Routes

// Get user's goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    const goals = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      targetValue: row.target_value,
      currentValue: row.current_value,
      unit: row.unit,
      category: row.category,
      startDate: row.start_date,
      targetDate: row.target_date,
      completed: row.completed,
      createdAt: row.created_at
    }));
    
    res.json({ success: true, goals });
  } catch (error) {
    console.error('Error getting goals:', error);
    res.status(500).json({ success: false, error: 'Failed to get goals' });
  }
});

// Add a new goal
app.post('/api/goals', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { 
    title, description, targetValue, currentValue, 
    unit, category, startDate, targetDate 
  } = req.body;
  
  if (!title || !targetValue || !category || !startDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID, title, target value, category, and start date are required' 
    });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO goals (
        user_id, title, description, target_value, current_value, 
        unit, category, start_date, target_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        userId, title, description, targetValue, currentValue || 0, 
        unit, category, startDate, targetDate
      ]
    );
    
    const goalId = result.rows[0].id;
    
    res.status(201).json({ success: true, goalId });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ success: false, error: 'Failed to add goal' });
  }
});

// Update a goal
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  const goalId = req.params.id;
  const userId = req.user.id;
  const { 
    title, description, targetValue, currentValue, 
    unit, category, startDate, targetDate, completed 
  } = req.body;
  
  if (!goalId) {
    return res.status(400).json({ success: false, error: 'Goal ID and User ID are required' });
  }
  
  try {
    // Verify goal belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    
    // Update goal
    await pool.query(
      `UPDATE goals SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        target_value = COALESCE($3, target_value),
        current_value = COALESCE($4, current_value),
        unit = COALESCE($5, unit),
        category = COALESCE($6, category),
        start_date = COALESCE($7, start_date),
        target_date = COALESCE($8, target_date),
        completed = COALESCE($9, completed)
      WHERE id = $10`,
      [
        title, description, targetValue, currentValue, 
        unit, category, startDate, targetDate, completed, goalId
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ success: false, error: 'Failed to update goal' });
  }
});

// Delete a goal
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const goalId = req.params.id;
  const userId = req.user.id;
  
  if (!goalId) {
    return res.status(400).json({ success: false, error: 'Goal ID and User ID are required' });
  }
  
  try {
    // Verify goal belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Goal not found' });
    }
    
    // Delete goal
    await pool.query('DELETE FROM goals WHERE id = $1', [goalId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ success: false, error: 'Failed to delete goal' });
  }
});

// Measurements API Routes

// Get user's measurements
app.get('/api/measurements', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  if (!userId) {
    return res.status(400).json({ success: false, error: 'User ID is required' });
  }
  
  try {
    const result = await pool.query(
      'SELECT * FROM measurements WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    
    const measurements = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      weight: row.weight,
      height: row.height,
      bodyFat: row.body_fat,
      chest: row.chest,
      waist: row.waist,
      hips: row.hips,
      arms: row.arms,
      thighs: row.thighs,
      notes: row.notes,
      createdAt: row.created_at
    }));
    
    res.json({ success: true, measurements });
  } catch (error) {
    console.error('Error getting measurements:', error);
    res.status(500).json({ success: false, error: 'Failed to get measurements' });
  }
});

// Add a new measurement
app.post('/api/measurements', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { 
    date, weight, height, bodyFat, 
    chest, waist, hips, arms, thighs, notes 
  } = req.body;
  
  if (!date) {
    return res.status(400).json({ 
      success: false, 
      error: 'User ID and date are required' 
    });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO measurements (
        user_id, date, weight, height, body_fat, 
        chest, waist, hips, arms, thighs, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        userId, date, weight, height, bodyFat, 
        chest, waist, hips, arms, thighs, notes
      ]
    );
    
    const measurementId = result.rows[0].id;
    
    res.status(201).json({ success: true, measurementId });
  } catch (error) {
    console.error('Error adding measurement:', error);
    res.status(500).json({ success: false, error: 'Failed to add measurement' });
  }
});

// Update a measurement
app.put('/api/measurements/:id', authenticateToken, async (req, res) => {
  const measurementId = req.params.id;
  const userId = req.user.id;
  const { 
    date, weight, height, bodyFat, 
    chest, waist, hips, arms, thighs, notes 
  } = req.body;
  
  if (!measurementId) {
    return res.status(400).json({ success: false, error: 'Measurement ID and User ID are required' });
  }
  
  try {
    // Verify measurement belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM measurements WHERE id = $1 AND user_id = $2',
      [measurementId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Measurement not found' });
    }
    
    // Update measurement
    await pool.query(
      `UPDATE measurements SET 
        date = COALESCE($1, date),
        weight = $2,
        height = $3,
        body_fat = $4,
        chest = $5,
        waist = $6,
        hips = $7,
        arms = $8,
        thighs = $9,
        notes = COALESCE($10, notes)
      WHERE id = $11`,
      [
        date, weight, height, bodyFat, 
        chest, waist, hips, arms, thighs, notes, measurementId
      ]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating measurement:', error);
    res.status(500).json({ success: false, error: 'Failed to update measurement' });
  }
});

// Delete a measurement
app.delete('/api/measurements/:id', authenticateToken, async (req, res) => {
  const measurementId = req.params.id;
  const userId = req.user.id;
  
  if (!measurementId) {
    return res.status(400).json({ success: false, error: 'Measurement ID and User ID are required' });
  }
  
  try {
    // Verify measurement belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM measurements WHERE id = $1 AND user_id = $2',
      [measurementId, userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Measurement not found' });
    }
    
    // Delete measurement
    await pool.query('DELETE FROM measurements WHERE id = $1', [measurementId]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    res.status(500).json({ success: false, error: 'Failed to delete measurement' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
