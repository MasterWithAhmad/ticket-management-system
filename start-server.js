// This is a simple script to start the server without using express-ejs-layouts
const fs = require('fs');
const path = require('path');

// Fix login.ejs
const loginPath = path.join(__dirname, 'views', 'login.ejs');
const loginContent = `<div class="card-body">
    <form action="/auth/login" method="POST">
        <div class="form-floating mb-3">
            <input class="form-control" id="inputEmail" name="email" type="email" placeholder="name@example.com" required />
            <label for="inputEmail">Email address</label>
        </div>
        <div class="form-floating mb-3">
            <input class="form-control" id="inputPassword" name="password" type="password" placeholder="Password" required />
            <label for="inputPassword">Password</label>
        </div>
        <div class="form-check mb-3">
            <input class="form-check-input" id="inputRememberPassword" type="checkbox" value="" name="remember" />
            <label class="form-check-label" for="inputRememberPassword">Remember Me</label>
        </div>
        <div class="d-flex align-items-center justify-content-between mt-4 mb-0">
            <a class="small" href="/auth/forgot-password">Forgot Password?</a>
            <button type="submit" class="btn btn-primary">Login</button>
        </div>
    </form>
</div>
<div class="card-footer text-center py-3">
    <div class="small"><a href="/auth/register">Need an account? Sign up!</a></div>
</div>`;

fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('Fixed login.ejs');

// Update server.js to not use express-ejs-layouts
const serverPath = path.join(__dirname, 'server.js');
const serverContent = `const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const ejs = require('ejs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'ticketing-system-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Database setup
const db = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

// Routes middleware
app.use('/auth', authRoutes);
app.use('/tickets', ticketRoutes);
app.use('/users', userRoutes);
app.use('/', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500');
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;`;

fs.writeFileSync(serverPath, serverContent, 'utf8');
console.log('Updated server.js');

// Now start the server
require('./server'); 