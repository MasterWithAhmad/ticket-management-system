const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('login', { 
    title: 'Login',
    error: req.session.error || null,
    layout: 'layouts/auth' // Use auth layout for login page
  });
  // Clear session error after rendering
  if (req.session.error) {
    delete req.session.error;
  }
});

// Register page
router.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('register', { 
    title: 'Register',
    error: req.session.error || null,
    layout: 'layouts/auth' // Use auth layout for register page
  });
  // Clear session error after rendering
  if (req.session.error) {
    delete req.session.error;
  }
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      req.session.error = 'Email and password are required';
      return res.redirect('/auth/login');
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    // Verify password
    const isMatch = await User.verifyPassword(password, user.password);
    if (!isMatch) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/auth/login');
    }

    // Set session data
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    // Redirect to dashboard
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.session.error = 'Server error during login';
    res.redirect('/auth/login');
  }
});

// Handle register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, password2, department } = req.body;

    // Validate input
    if (!name || !email || !password) {
      req.session.error = 'All fields are required';
      return res.redirect('/auth/register');
    }

    if (password !== password2) {
      req.session.error = 'Passwords do not match';
      return res.redirect('/auth/register');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      req.session.error = 'User with this email already exists';
      return res.redirect('/auth/register');
    }

    // Create user with 'user' role explicitly
    const user = await User.create({
      name,
      email,
      password,
      role: 'user', // Ensure this is always 'user' for self-registration
      department
    });

    // Set session data
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    // Redirect to dashboard
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.session.error = 'Server error during registration';
    res.redirect('/auth/register');
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/auth/login');
  });
});

// Password reset request page
router.get('/forgot-password', (req, res) => {
  res.render('password', { 
    title: 'Reset Password',
    error: req.session.error || null 
  });
  // Clear session error after rendering
  if (req.session.error) {
    delete req.session.error;
  }
});

module.exports = router; 