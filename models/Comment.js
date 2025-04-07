const db = require('../config/database');

class Comment {
  // Get comment by ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          c.*,
          u.name as user_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `, [id], (err, comment) => {
        if (err) {
          return reject(err);
        }
        resolve(comment);
      });
    });
  }

  // Create a new comment
  static create(commentData) {
    const { ticket_id, user_id, content } = commentData;
    
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO comments (ticket_id, user_id, content) VALUES (?, ?, ?)',
        [ticket_id, user_id, content],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, ...commentData });
        }
      );
    });
  }

  // Get comments for a ticket
  static findByTicketId(ticketId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          c.*,
          u.name as user_name
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.ticket_id = ?
        ORDER BY c.created_at ASC
      `, [ticketId], (err, comments) => {
        if (err) {
          return reject(err);
        }
        resolve(comments);
      });
    });
  }

  // Delete comment
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id, changes: this.changes });
      });
    });
  }
}

module.exports = Comment; 