const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { isAuthenticated, loadUser } = require('../middleware/auth');

// Apply middleware
router.use(isAuthenticated);
router.use(loadUser);

// Middleware to add layout option to all responses
router.use((req, res, next) => {
  // Store the original render method
  const originalRender = res.render;
  
  // Override render method to always include layout option and clear messages after rendering
  res.render = function(view, options, callback) {
    // Set layout for all views if not explicitly specified
    const opts = options || {};
    if (!opts.layout) {
      opts.layout = 'layouts/main';
    }
    
    // Add success/error messages from session if not already provided
    if (!opts.success && req.session.success) {
      opts.success = req.session.success;
    }
    
    if (!opts.error && req.session.error) {
      opts.error = req.session.error;
    }
    
    // Clear session messages to prevent them appearing on subsequent requests
    if (req.session.success) delete req.session.success;
    if (req.session.error) delete req.session.error;
    
    // Call the original render with the updated options
    return originalRender.call(this, view, opts, callback);
  };
  
  next();
});

// Dashboard
router.get('/', async (req, res) => {
  try {
    // Get ticket statistics
    const stats = await Ticket.getStats();
    
    // Get recent tickets (limit 5)
    const recentTickets = await Ticket.findAll();
    const tickets = recentTickets.slice(0, 5);
    
    // Get user's assigned tickets
    const assignedTickets = await Ticket.findByAssignee(req.session.userId);
    
    res.render('index', {
    layout: 'layouts/main', 
      title: 'Dashboard',
      stats,
      tickets,
      assignedTickets: assignedTickets.slice(0, 5),
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Charts & Statistics Page
router.get('/charts', async (req, res) => {
  try {
    // Get ticket statistics for charts
    const stats = await Ticket.getStats();
    
    res.render('charts', {
    layout: 'layouts/main', 
      title: 'Ticket Statistics',
      stats,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

module.exports = router; 