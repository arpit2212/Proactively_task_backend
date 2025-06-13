const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const router = express.Router();

// JWT auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Register endpoint with enhanced error handling
router.post('/register', async (req, res) => {
  try {
    console.log('=== REGISTRATION DEBUG START ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET && !process.env.JWT_SECRET) {
      console.error('CRITICAL: JWT_SECRET not found in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { email, username, password, role = 'user' } = req.body;

    // Enhanced validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      console.log('Registration failed: Invalid email');
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!username || typeof username !== 'string' || !username.trim()) {
      console.log('Registration failed: Invalid username');
      return res.status(400).json({ error: 'Valid username is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      console.log('Registration failed: Invalid password');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.log('Registration failed: Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Username validation
    if (username.trim().length < 3) {
      console.log('Registration failed: Username too short');
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    console.log('Processing registration for:', { email: trimmedEmail, username: trimmedUsername, role });

    // Test Supabase connection
    try {
      console.log('Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return res.status(500).json({ error: 'Database connection failed' });
      }
      console.log('Supabase connection successful');
    } catch (connectionError) {
      console.error('Supabase connection error:', connectionError);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    // Hash password
    console.log('Hashing password...');
    const saltRounds = 10;
    let passwordHash;
    try {
      passwordHash = await bcrypt.hash(password, saltRounds);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Password hashing failed:', hashError);
      return res.status(500).json({ error: 'Password processing failed' });
    }

    // Insert user into database
    console.log('Inserting user into database...');
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        email: trimmedEmail, 
        username: trimmedUsername, 
        password_hash: passwordHash, 
        role 
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.details && error.details.includes('email')) {
          return res.status(400).json({ error: 'Email already exists' });
        } else if (error.details && error.details.includes('username')) {
          return res.status(400).json({ error: 'Username already exists' });
        } else {
          return res.status(400).json({ error: 'Email or username already exists' });
        }
      }
      
      // For other database errors
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    console.log('User created successfully:', data);

    // Generate JWT token
    console.log('Generating JWT token...');
    let token;
    try {
      token = jwt.sign(
        { userId: data.id, email: data.email, role: data.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      console.log('JWT token generated successfully');
    } catch (jwtError) {
      console.error('JWT generation failed:', jwtError);
      return res.status(500).json({ error: 'Token generation failed' });
    }

    console.log('=== REGISTRATION SUCCESS ===');
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        role: data.role
      },
      token
    });

  } catch (error) {
    console.error('=== REGISTRATION ERROR ===');
    console.error('Unexpected error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Login endpoint with enhanced validation
router.post('/login', async (req, res) => {
  try {
    console.log('=== LOGIN DEBUG START ===');
    console.log('Login attempt:', {
      body: { email: req.body.email, password: '***' },
      headers: req.headers['content-type']
    });

    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    console.log('Querying database for user...');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', trimmedEmail)
      .single();

    if (error || !user) {
      console.log('Login failed: User not found for email:', trimmedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found, verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('Password verified, generating token...');
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('=== LOGIN SUCCESS ===');
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile endpoint
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, role, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = {
  router,
  authenticateToken
};