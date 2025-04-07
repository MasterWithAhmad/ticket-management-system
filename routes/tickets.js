const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { isAuthenticated, isAdmin, loadUser } = require('../middleware/auth');

// Apply authentication middleware to all routes
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

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const tickets = await Ticket.findAll();
    const users = await User.findAll();
    
    res.render('tables', {
    layout: 'layouts/main', 
      title: 'All Tickets',
      tickets,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      filter: 'all'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Filter tickets by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const tickets = await Ticket.findByStatus(status);
    const users = await User.findAll();
    
    res.render('tables', {
    layout: 'layouts/main', 
      title: `${status.charAt(0).toUpperCase() + status.slice(1)} Tickets`,
      tickets,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      filter: status
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get tickets assigned to logged in user
router.get('/my-tickets', async (req, res) => {
  try {
    const tickets = await Ticket.findByAssignee(req.session.userId);
    const users = await User.findAll();
    
    res.render('tables', {
    layout: 'layouts/main', 
      title: 'My Assigned Tickets',
      tickets,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      filter: 'assigned'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get tickets created by logged in user
router.get('/created', async (req, res) => {
  try {
    const tickets = await Ticket.findByCreator(req.session.userId);
    const users = await User.findAll();
    
    res.render('tables', {
    layout: 'layouts/main', 
      title: 'My Created Tickets',
      tickets,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      filter: 'created'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get new ticket form
router.get('/new', async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.render('ticket-form', {
    layout: 'layouts/main', 
      title: 'Create New Ticket',
      ticket: null,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      action: 'create'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Create new ticket
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, category, assigned_to } = req.body;
    
    await Ticket.create({
      title,
      description,
      priority,
      category,
      created_by: req.session.userId,
      assigned_to: assigned_to || null
    });
    
    res.redirect('/tickets');
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get single ticket
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).render('404');
    }
    
    const comments = await Comment.findByTicketId(id);
    const users = await User.findAll();
    
    res.render('ticket-detail', {
    layout: 'layouts/main', 
      title: `Ticket #${id}`,
      ticket,
      comments,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get edit ticket form
router.get('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return res.status(404).render('404');
    }
    
    const users = await User.findAll();
    
    res.render('ticket-form', {
    layout: 'layouts/main', 
      title: `Edit Ticket #${id}`,
      ticket,
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      action: 'edit'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Update ticket
router.post('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category, assigned_to } = req.body;
    
    await Ticket.update(id, {
      title,
      description,
      status,
      priority,
      category,
      assigned_to: assigned_to || null
    });
    
    res.redirect(`/tickets/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Add comment to ticket
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    await Comment.create({
      ticket_id: id,
      user_id: req.session.userId,
      content
    });
    
    res.redirect(`/tickets/${id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Delete ticket (admin only)
router.post('/:id/delete', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await Ticket.delete(id);
    
    res.redirect('/tickets');
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

module.exports = router; 