const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;
const JWT_SECRET = 'your-secret-key'; // Change this in production

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Replace with your MySQL username
    password: '1234567', // Replace with your MySQL password
    database: 'SAM'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Check if users table exists, if not create it
    checkAndCreateTables();
});

// Function to check if tables exist and create them if needed
function checkAndCreateTables() {
    // Check if users table exists
    db.query("SHOW TABLES LIKE 'users'", (err, results) => {
        if (err) {
            console.error('Error checking users table: ', err);
            return;
        }
        
        if (results.length === 0) {
            // Users table doesn't exist, create it
            createUsersTable();
        } else {
            console.log('Users table already exists');
        }
    });
}

// Create users table for authentication
const createUsersTable = () => {
  // Fixed SQL syntax - removed trailing comma before closing parenthesis
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(sql, (err) => {
    if (err) {
      console.error('Error creating users table: ', err);
    } else {
      console.log('Users table ready');
    }
  });
};

// Authentication Routes

// Register a new user
app.post('/auth/register', async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  
  // Basic validation
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if user already exists
  const checkSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkSql, [email], async (err, results) => {
    if (err) {
      console.error('Error checking user: ', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length > 0) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }
    
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user into database
      const insertSql = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
      db.query(insertSql, [first_name, last_name, email, hashedPassword], (err, results) => {
        if (err) {
          console.error('Error creating user: ', err);
          return res.status(500).json({ error: 'Error creating user' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: results.insertId, email: email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({ 
          message: 'User registered successfully', 
          userId: results.insertId,
          token: token
        });
      });
    } catch (error) {
      console.error('Error hashing password: ', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Login user
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Error logging in: ', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = results[0];
    
    try {
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ 
        message: 'Login successful', 
        token: token,
        user: { 
          id: user.id, 
          first_name: user.first_name, 
          last_name: user.last_name, 
          email: user.email 
        }
      });
    } catch (error) {
      console.error('Error comparing passwords: ', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/auth/profile', authenticateToken, (req, res) => {
  const sql = 'SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?';
  db.query(sql, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching user: ', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: results[0] });
  });
});

// Original CRUD routes from your existing code
// Get all users
app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users: ', err);
            res.status(500).json({ error: 'Error fetching users' });
            return;
        }
        res.json(results);
    });
});

// Get a single user by ID
app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user: ', err);
            res.status(500).json({ error: 'Error fetching user' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(results[0]);
    });
});

// Create a new user
app.post('/users', (req, res) => {
    const { name, email } = req.body;
    const sql = 'INSERT INTO users (name, email) VALUES (?, ?)';
    db.query(sql, [name, email], (err, results) => {
        if (err) {
            console.error('Error creating user: ', err);
            res.status(500).json({ error: 'Error creating user' });
            return;
        }
        res.json({ id: results.insertId, name, email });
    });
});

// Update a user
app.put('/users/:id', (req, res) => {
    const userId = req.params.id;
    const { name, email } = req.body;
    const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
    db.query(sql, [name, email, userId], (err, results) => {
        if (err) {
            console.error('Error updating user: ', err);
            res.status(500).json({ error: 'Error updating user' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ id: userId, name, email });
    });
});

// Delete a user
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error deleting user: ', err);
            res.status(500).json({ error: 'Error deleting user' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server gracefully');
    db.end((err) => {
        if (err) {
            console.error('Error closing database connection: ', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});