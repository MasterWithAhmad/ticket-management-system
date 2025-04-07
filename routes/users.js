const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, isAdmin, loadUser } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(isAuthenticated);
router.use(loadUser);

// Middleware to add layout option to all responses
router.use((req, res, next) => {
  // Store the original render method
  const originalRender = res.render;
  
  // Override render method to always include layout option
  res.render = function(view, options, callback) {
    // Set layout for all views if not explicitly specified
    const opts = options || {};
    if (!opts.layout) {
      opts.layout = 'layouts/main';
    }
    
    // Call the original render with the updated options
    return originalRender.call(this, view, opts, callback);
  };
  
  next();
});

// Middleware to clear session messages after they're used
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

// Get all users (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    
    res.render('users', {
    layout: 'layouts/main', 
      title: 'User Management',
      users,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get user profile form
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    
    if (!user) {
      return res.status(404).render('404');
    }
    
    res.render('profile', {
    layout: 'layouts/main', 
      title: 'My Profile',
      profileUser: user,
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      success: req.session.success || null,
      error: req.session.error || null
    });
    
    // Clear session messages
    if (req.session.success) delete req.session.success;
    if (req.session.error) delete req.session.error;
    
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Update user profile
router.post('/profile', async (req, res) => {
  try {
    const { name, email, department } = req.body;
    
    await User.update(req.session.userId, {
      name,
      email,
      role: res.locals.user.role, // Keep the existing role
      department
    });
    
    req.session.success = 'Profile updated successfully';
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.session.error = 'Error updating profile';
    res.redirect('/users/profile');
  }
});

// Change password form
router.get('/change-password', async (req, res) => {
  try {
    res.render('change-password', {
    layout: 'layouts/main', 
      title: 'Change Password',
      isAdmin: req.session.userRole === 'admin',
      user: res.locals.user,
      error: req.session.error || null
    });
    
    // Clear session error
    if (req.session.error) delete req.session.error;
    
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Change password
router.post('/change-password', async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    
    // Check if passwords match
    if (new_password !== confirm_password) {
      req.session.error = 'New passwords do not match';
      return res.redirect('/users/change-password');
    }
    
    // Get current user with password
    const user = await User.findByEmail(res.locals.user.email);
    
    // Verify current password
    const isMatch = await User.verifyPassword(current_password, user.password);
    if (!isMatch) {
      req.session.error = 'Current password is incorrect';
      return res.redirect('/users/change-password');
    }
    
    // Update password
    await User.changePassword(req.session.userId, new_password);
    
    req.session.success = 'Password changed successfully';
    res.redirect('/users/profile');
  } catch (err) {
    console.error(err);
    req.session.error = 'Error changing password';
    res.redirect('/users/change-password');
  }
});

// Get new user form (admin only)
router.get('/new', isAdmin, async (req, res) => {
  try {
    res.render('user-form', {
    layout: 'layouts/main', 
      title: 'Create New User',
      userData: null,
      isAdmin: true,
      user: res.locals.user,
      action: 'create'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Create new user (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    
    await User.create({
      name,
      email,
      password,
      role,
      department
    });
    
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Get edit user form (admin only)
router.get('/:id/edit', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await User.findById(id);
    
    if (!userData) {
      return res.status(404).render('404');
    }
    
    res.render('user-form', {
    layout: 'layouts/main', 
      title: 'Edit User',
      userData,
      isAdmin: true,
      user: res.locals.user,
      action: 'edit'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Update user (admin only)
router.post('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department } = req.body;
    
    await User.update(id, {
      name,
      email,
      role,
      department
    });
    
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

// Delete user (admin only)
router.post('/:id/delete', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (id == req.session.userId) {
      req.session.error = 'You cannot delete your own account';
      return res.redirect('/users');
    }
    
    await User.delete(id);
    
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    res.status(500).render('500');
  }
});

module.exports = router; 