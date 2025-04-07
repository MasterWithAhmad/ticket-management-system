const db = require('../config/database');

class Ticket {
  // Get ticket by ID with user details
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          t.*, 
          creator.name as creator_name,
          assignee.name as assignee_name
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.id = ?
      `, [id], (err, ticket) => {
        if (err) {
          return reject(err);
        }
        resolve(ticket);
      });
    });
  }

  // Create a new ticket
  static create(ticketData) {
    const { title, description, status = 'open', priority = 'medium', category, created_by, assigned_to = null } = ticketData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tickets 
          (title, description, status, priority, category, created_by, assigned_to) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, status, priority, category, created_by, assigned_to],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, ...ticketData });
        }
      );
    });
  }

  // Update ticket
  static update(id, ticketData) {
    const { title, description, status, priority, category, assigned_to } = ticketData;
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tickets 
         SET title = ?, 
             description = ?, 
             status = ?, 
             priority = ?, 
             category = ?, 
             assigned_to = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [title, description, status, priority, category, assigned_to, id],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id, ...ticketData, changes: this.changes });
        }
      );
    });
  }

  // Get all tickets with user details
  static findAll() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          t.*, 
          creator.name as creator_name,
          assignee.name as assignee_name
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        ORDER BY t.created_at DESC
      `, (err, tickets) => {
        if (err) {
          return reject(err);
        }
        resolve(tickets);
      });
    });
  }

  // Get tickets by status
  static findByStatus(status) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          t.*, 
          creator.name as creator_name,
          assignee.name as assignee_name
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.status = ?
        ORDER BY t.created_at DESC
      `, [status], (err, tickets) => {
        if (err) {
          return reject(err);
        }
        resolve(tickets);
      });
    });
  }

  // Get tickets assigned to a user
  static findByAssignee(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          t.*, 
          creator.name as creator_name,
          assignee.name as assignee_name
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.assigned_to = ?
        ORDER BY t.created_at DESC
      `, [userId], (err, tickets) => {
        if (err) {
          return reject(err);
        }
        resolve(tickets);
      });
    });
  }

  // Get tickets created by a user
  static findByCreator(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          t.*, 
          creator.name as creator_name,
          assignee.name as assignee_name
        FROM tickets t
        LEFT JOIN users creator ON t.created_by = creator.id
        LEFT JOIN users assignee ON t.assigned_to = assignee.id
        WHERE t.created_by = ?
        ORDER BY t.created_at DESC
      `, [userId], (err, tickets) => {
        if (err) {
          return reject(err);
        }
        resolve(tickets);
      });
    });
  }

  // Delete ticket
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tickets WHERE id = ?', [id], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id, changes: this.changes });
      });
    });
  }

  // Get ticket statistics
  static getStats() {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
          SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
          SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority
        FROM tickets
      `, (err, stats) => {
        if (err) {
          return reject(err);
        }
        resolve(stats[0]);
      });
    });
  }
}

module.exports = Ticket; 