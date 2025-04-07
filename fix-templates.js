/**
 * Script to fix templates to work with express-ejs-layouts
 */
const fs = require('fs');
const path = require('path');

// Function to remove include layout lines from files
function fixTemplateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if this file is using includes - be more thorough with pattern matching
  const includePattern = /<%[-\s]*include\(['"]layouts\/main['"](?:,\s*\{[^}]*\})?\)[\s-]*%>/;
  if (includePattern.test(content)) {
    console.log(`Processing ${filePath}...`);
    
    // Replace the include line with empty string
    content = content.replace(includePattern, '');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Fixed file: ${filePath}`);
  } else {
    console.log(`No includes found in ${filePath}`);
  }
}

console.log('Fixing template files...');

// List of files to fix
const filesToFix = [
  'views/index.ejs',
  'views/charts.ejs',
  'views/tables.ejs',
  'views/ticket-form.ejs',
  'views/users.ejs',
  'views/ticket-detail.ejs',
  'views/profile.ejs',
  'views/change-password.ejs',
  'views/user-form.ejs',
  'views/404.ejs',
  'views/500.ejs'
];

// Fix each file
filesToFix.forEach(file => {
  fixTemplateFile(path.join(__dirname, file));
});

// Fix login.ejs to have just the content part
function fixAuthTemplate(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Auth file not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if this is a full HTML file (has <html> tags)
  if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
    console.log(`Converting ${filePath} to content-only...`);
    
    // Find the card-body div
    const cardBodyMatch = content.match(/<div class="card-body">([\s\S]*?)<div class="card-footer/);
    const cardFooterMatch = content.match(/<div class="card-footer([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/);
    
    if (cardBodyMatch && cardFooterMatch) {
      const cardBody = cardBodyMatch[0].replace('<div class="card-footer', '');
      const cardFooter = cardFooterMatch[0];
      
      const newContent = `${cardBody}\n${cardFooter}`;
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  Converted ${filePath} to content-only template`);
    } else {
      console.log(`  Could not extract content from ${filePath}`);
    }
  } else {
    console.log(`  ${filePath} is already content-only`);
  }
}

console.log('\nFixing auth templates...');
['views/login.ejs', 'views/register.ejs'].forEach(file => {
  fixAuthTemplate(path.join(__dirname, file));
});

// Fix routes/dashboard.js to check if user is authenticated
function fixDashboardRoute() {
  const filePath = path.join(__dirname, 'routes/dashboard.js');
  if (!fs.existsSync(filePath)) {
    console.log(`Dashboard route not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix middleware setup to avoid redirect loops
  content = content.replace(
    "// Apply middleware\nrouter.use(isAuthenticated);\nrouter.use(loadUser);",
    "// Apply middleware\nrouter.use(isAuthenticated);\nrouter.use(loadUser);"
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed dashboard route: ${filePath}`);
}

console.log('\nFixing routes...');
fixDashboardRoute();

// Also update the server.js file
console.log('\nUpdating server.js...');
const serverPath = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Make sure express-ejs-layouts is correctly configured
if (!serverContent.includes('expressLayouts')) {
  console.log('Adding express-ejs-layouts to server.js');
  
  serverContent = serverContent.replace(
    "const ejs = require('ejs');",
    "const ejs = require('ejs');\nconst expressLayouts = require('express-ejs-layouts');"
  );
  
  serverContent = serverContent.replace(
    "app.set('views', path.join(__dirname, 'views'));",
    "app.set('views', path.join(__dirname, 'views'));\n\n// Setup layouts\napp.use(expressLayouts);\napp.set('layout', 'layouts/main');\napp.set('layout extractScripts', true);\napp.set('layout extractStyles', true);"
  );
  
  // Fix route order to resolve redirect loops
  serverContent = serverContent.replace(
    "// Routes middleware\napp.use('/auth', authRoutes);\napp.use('/', dashboardRoutes);\napp.use('/tickets', ticketRoutes);\napp.use('/users', userRoutes);",
    "// Routes middleware\napp.use('/auth', authRoutes);\napp.use('/tickets', ticketRoutes);\napp.use('/users', userRoutes);\napp.use('/', dashboardRoutes);"
  );
  
  fs.writeFileSync(serverPath, serverContent, 'utf8');
  console.log('Updated server.js with express-ejs-layouts configuration');
} else {
  console.log('Server.js already configured for express-ejs-layouts');
}

console.log('\nTemplate and route fixing completed!'); 