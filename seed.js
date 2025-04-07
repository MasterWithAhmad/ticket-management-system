const db = require('./config/database');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  console.log('Starting database seeding process...');

  try {
    // Hash password for admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Insert admin user
    db.run(`
      INSERT OR IGNORE INTO users (name, email, password, role, department, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, ['Admin User', 'admin@example.com', adminPassword, 'admin', 'IT'], function(err) {
      if (err) {
        console.error('Error creating admin user:', err);
        return;
      }
      console.log('Admin user created or already exists');
    });

    // Insert normal users
    const users = [
      { name: 'John Smith', email: 'john@example.com', password: userPassword, role: 'user', department: 'IT' },
      { name: 'Jane Doe', email: 'jane@example.com', password: userPassword, role: 'user', department: 'HR' },
      { name: 'Bob Johnson', email: 'bob@example.com', password: userPassword, role: 'user', department: 'Finance' }
    ];

    users.forEach(user => {
      db.run(`
        INSERT OR IGNORE INTO users (name, email, password, role, department, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `, [user.name, user.email, user.password, user.role, user.department], function(err) {
        if (err) {
          console.error(`Error creating user ${user.name}:`, err);
          return;
        }
        console.log(`User ${user.name} created or already exists`);
      });
    });

    // Wait for users to be created before creating tickets
    setTimeout(() => {
      // Get user IDs
      db.all('SELECT id, name FROM users', (err, users) => {
        if (err) {
          console.error('Error fetching users:', err);
          return;
        }

        const adminUser = users.find(user => user.name === 'Admin User');
        const johnUser = users.find(user => user.name === 'John Smith');
        const janeUser = users.find(user => user.name === 'Jane Doe');
        const bobUser = users.find(user => user.name === 'Bob Johnson');

        if (!adminUser || !johnUser || !janeUser || !bobUser) {
          console.error('Could not find all required users');
          return;
        }

        // Sample tickets
        const tickets = [
          {
            title: 'Email Not Working',
            description: 'I cannot access my email account. It says credentials are invalid.',
            status: 'open',
            priority: 'high',
            category: 'Technical Issue',
            created_by: johnUser.id,
            assigned_to: adminUser.id
          },
          {
            title: 'Request for New Monitor',
            description: 'I need a new monitor as my current one has dead pixels.',
            status: 'in_progress',
            priority: 'medium',
            category: 'Hardware Request',
            created_by: janeUser.id,
            assigned_to: adminUser.id
          },
          {
            title: 'Software Installation',
            description: 'Need Microsoft Office installed on my new laptop.',
            status: 'open',
            priority: 'low',
            category: 'Software Request',
            created_by: bobUser.id,
            assigned_to: johnUser.id
          },
          {
            title: 'Password Reset',
            description: 'I forgot my password for the accounting system.',
            status: 'resolved',
            priority: 'medium',
            category: 'Account Issue',
            created_by: janeUser.id,
            assigned_to: null
          },
          {
            title: 'Printer Not Working',
            description: 'The printer on the 2nd floor is not responding.',
            status: 'closed',
            priority: 'low',
            category: 'Technical Issue',
            created_by: bobUser.id,
            assigned_to: johnUser.id
          },
          {
            title: 'VPN Connection Issues',
            description: 'Cannot connect to the company VPN from home.',
            status: 'in_progress',
            priority: 'high',
            category: 'Network Issue',
            created_by: janeUser.id,
            assigned_to: adminUser.id
          }
        ];

        // Insert tickets
        tickets.forEach(ticket => {
          db.run(`
            INSERT OR IGNORE INTO tickets 
            (title, description, status, priority, category, created_by, assigned_to, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `, [
            ticket.title, 
            ticket.description, 
            ticket.status, 
            ticket.priority, 
            ticket.category, 
            ticket.created_by, 
            ticket.assigned_to
          ], function(err) {
            if (err) {
              console.error(`Error creating ticket "${ticket.title}":`, err);
              return;
            }
            
            const ticketId = this.lastID;
            if (ticketId) {
              console.log(`Ticket "${ticket.title}" created with ID ${ticketId}`);
              
              // Add some comments for this ticket
              if (ticket.status !== 'open') {
                const comments = [
                  {
                    content: 'I am looking into this issue now.',
                    user_id: adminUser.id
                  },
                  {
                    content: 'Thanks for the quick response!',
                    user_id: ticket.created_by
                  }
                ];
                
                if (ticket.status === 'resolved' || ticket.status === 'closed') {
                  comments.push({
                    content: 'This issue has been resolved. The fix was applied.',
                    user_id: ticket.assigned_to || adminUser.id
                  });
                }
                
                comments.forEach(comment => {
                  db.run(`
                    INSERT INTO comments (ticket_id, user_id, content, created_at)
                    VALUES (?, ?, ?, datetime('now', '-' || ? || ' hours'))
                  `, [
                    ticketId,
                    comment.user_id,
                    comment.content,
                    Math.floor(Math.random() * 48) // Random hours ago (0-48)
                  ], function(err) {
                    if (err) {
                      console.error(`Error creating comment for ticket ${ticketId}:`, err);
                    }
                  });
                });
              }
            } else {
              console.log(`Ticket "${ticket.title}" already exists`);
            }
          });
        });
        
        console.log('Seeding process completed.');
      });
    }, 1000); // Wait 1 second for users to be created
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function
seedDatabase(); 