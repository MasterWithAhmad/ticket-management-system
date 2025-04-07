const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // Don't check authentication for auth routes
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  
  // Check if user session exists
  if (req.session && req.session.userId) {
    return next();
  }
  
  // If not authenticated, redirect to login page
  res.redirect('/auth/login');
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  // If not admin, redirect to dashboard with error
  req.session.errorMessage = 'Access denied. Admin privileges required.';
  res.redirect('/');
};

// Middleware to load user data
const loadUser = (req, res, next) => {
  if (req.session && req.session.userId) {
    db.get('SELECT id, name, email, role, department FROM users WHERE id = ?', 
      [req.session.userId], 
      (err, user) => {
        if (err) {
          return next(err);
        }
        if (user) {
          res.locals.user = user;
        }
        next();
      });
  } else {
    next();
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  loadUser
}; 