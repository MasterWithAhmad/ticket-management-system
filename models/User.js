const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Get user by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, role, department, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  // Get user by email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  // Create a new user
  static async create(userData) {
    const { name, email, password, role = 'user', department } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, role, department],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, name, email, role, department });
        }
      );
    });
  }

  // Update user
  static update(id, userData) {
    const { name, email, role, department } = userData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET name = ?, email = ?, role = ?, department = ? WHERE id = ?',
        [name, email, role, department, id],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id, name, email, role, department, changes: this.changes });
        }
      );
    });
  }

  // Change password
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id, changes: this.changes });
        }
      );
    });
  }

  // Get all users
  static findAll() {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, name, email, role, department, created_at FROM users', (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  // Delete user
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id, changes: this.changes });
      });
    });
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User; 