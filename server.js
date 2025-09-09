const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 5000;
const JWT_SECRET = 'your-secret-key'; // Change this in production

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// First connect without database specified
const config = {
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '1234567', // Replace with your MySQL password
};

// Create initial connection
const initialConnection = mysql.createConnection(config);

// Check and create database if it doesn't exist
initialConnection.connect((err) => {
  if (err) {
    console.error('Initial connection failed: ', err);
    process.exit(1);
  }

  console.log('Connected to MySQL server');

  // Create database if it doesn't exist
  initialConnection.query("CREATE DATABASE IF NOT EXISTS SAM", (err) => {
    if (err) {
      console.error('Error creating database: ', err);
      process.exit(1);
    }

    console.log('SAM database ready');

    // Close initial connection
    initialConnection.end();

    // Now connect to the SAM database
    connectToDatabase();
  });
});

// Connect to SAM database
function connectToDatabase() {
  const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234567',
    database: 'SAM'
  });

  db.connect((err) => {
    if (err) {
      console.error('Database connection failed: ', err);
      return;
    }
    console.log('Connected to SAM database');

    // Check if tables exist, if not create them
    checkAndCreateTables(db);

    // Set the db connection to app for use in routes
    app.locals.db = db;
  });
}

// Function to check if tables exist and create them if needed
function checkAndCreateTables(db) {
  // Create users table for authentication
  const createUsersTable = () => {
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

  // Create admins table for admin authentication
  const createAdminsTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        admin_pin VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.query(sql, (err) => {
      if (err) {
        console.error('Error creating admins table: ', err);
      } else {
        console.log('Admins table ready');
        createDefaultAdmin(db);
      }
    });
  };

  // Create user_profile table
  const createUserProfileTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_profile (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) UNIQUE,
        age INT,
        gender ENUM('Male', 'Female', 'Other'),
        phone VARCHAR(20),
        profile_photo VARCHAR(255),
        course VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.query(sql, (err) => {
      if (err) {
        console.error('Error creating user_profile table: ', err);
      } else {
        console.log('User_profile table ready');
      }
    });
  };

  // Create user_university table
  const createUserUniversityTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_university (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        university_id VARCHAR(50),
        university_name VARCHAR(255) NOT NULL,
        application_status ENUM('Interested', 'Applied', 'Accepted', 'Rejected') DEFAULT 'Interested',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.query(sql, (err) => {
      if (err) {
        console.error('Error creating user_university table: ', err);
      } else {
        console.log('User_university table ready');
      }
    });
  };

  // Create admin_profile table
  const createAdminProfileTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS admin_profile (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        username VARCHAR(50) UNIQUE,
        age INT,
        gender ENUM('Male', 'Female', 'Other'),
        phone VARCHAR(20),
        profile_photo VARCHAR(255),
        admin_pin VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      )
    `;

    db.query(sql, (err) => {
      if (err) {
        console.error('Error creating admin_profile table: ', err);
      } else {
        console.log('Admin_profile table ready');
      }
    });
  };

  // Create admin_userlist table
  const createAdminUserlistTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS admin_userlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL,
        username VARCHAR(50),
        age INT,
        gender ENUM('Male', 'Female', 'Other'),
        phone VARCHAR(20),
        course VARCHAR(100),
        profile_photo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;

    db.query(sql, (err) => {
      if (err) {
        console.error('Error creating admin_userlist table: ', err);
      } else {
        console.log('Admin_userlist table ready');
      }
    });
  };

  // Create a default admin account if no admins exist
  const createDefaultAdmin = (db) => {
    const checkSql = 'SELECT COUNT(*) as count FROM admins';
    db.query(checkSql, async (err, results) => {
      if (err) {
        console.error('Error checking admin count: ', err);
        return;
      }

      if (results[0].count === 0) {
        try {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          db.query(
            `INSERT INTO admins (first_name, last_name, email, password, admin_pin) VALUES (?, ?, ?, ?, ?)`,
            ['Shivan', 'Mishra', 'shivrom.2020@gmail.com', '191394', '19113'],
            (err) => {
              if (err) {
                console.error('Error creating default admin: ', err);
              } else {
                console.log('Default admin account created');
              }
            }
          );
        } catch (error) {
          console.error('Error hashing password for default admin: ', error);
        }
      }
    });
  };

  // Check and create all tables
  createUsersTable();
  createAdminsTable();
  createUserProfileTable();
  createUserUniversityTable();
  createAdminProfileTable();
  createAdminUserlistTable();
}

// Middleware to get database connection
app.use((req, res, next) => {
  if (!app.locals.db) {
    return res.status(503).json({ error: 'Database not connected. Please try again later.' });
  }
  req.db = app.locals.db;
  next();
});

// Middleware to verify JWT token for users
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

// Middleware to verify JWT token for admins
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    if (!admin.adminId) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = admin;
    next();
  });
};

// Serve the signin page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

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
  req.db.query(checkSql, [email], async (err, results) => {
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
      req.db.query(insertSql, [first_name, last_name, email, hashedPassword], (err, results) => {
        if (err) {
          console.error('Error creating user: ', err);
          return res.status(500).json({ error: 'Error creating user' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: results.insertId, email: email, role: 'user' },
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

// Register a new admin
app.post('/admin/register', async (req, res) => {
  const { first_name, last_name, email, password, admin_pin } = req.body;

  // Basic validation
  if (!first_name || !last_name || !email || !password || !admin_pin) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check if admin already exists
  const checkSql = 'SELECT * FROM admins WHERE email = ?';
  req.db.query(checkSql, [email], async (err, results) => {
    if (err) {
      console.error('Error checking admin: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: 'Admin already exists with this email' });
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert admin into database
      const insertSql = 'INSERT INTO admins (first_name, last_name, email, password, admin_pin) VALUES (?, ?, ?, ?, ?)';
      req.db.query(insertSql, [first_name, last_name, email, hashedPassword, admin_pin], (err, results) => {
        if (err) {
          console.error('Error creating admin: ', err);
          return res.status(500).json({ error: 'Error creating admin' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { adminId: results.insertId, email: email, role: 'admin' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Admin registered successfully',
          adminId: results.insertId,
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
  req.db.query(sql, [email], async (err, results) => {
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
        { userId: user.id, email: user.email, role: 'user' },
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
          email: user.email,
          role: 'user'
        }
      });
    } catch (error) {
      console.error('Error comparing passwords: ', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// Admin login
app.post('/admin/login', (req, res) => {
  const { email, password, admin_pin } = req.body;

  if (!email || !password || !admin_pin) {
    return res.status(400).json({ error: 'Email, password and admin PIN are required' });
  }

  const sql = 'SELECT * FROM admins WHERE email = ?';
  req.db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Error with admin login: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const admin = results[0];

    // Check admin PIN
    if (admin_pin !== admin.admin_pin) {
      return res.status(401).json({ error: 'Invalid admin PIN' });
    }

    try {
      // Compare passwords
      const isMatch = await bcrypt.compare(password, admin.password);

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          adminId: admin.id,
          email: admin.email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Admin login successful',
        token: token,
        admin: {
          id: admin.id,
          first_name: admin.first_name,
          last_name: admin.last_name,
          email: admin.email,
          role: 'admin'
        }
      });
    } catch (error) {
      console.error('Error comparing passwords: ', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

// User Profile Routes

// Get user profile
app.get('/user/profile', authenticateToken, (req, res) => {
  const sql = `
    SELECT up.*, u.first_name, u.last_name, u.email 
    FROM user_profile up 
    JOIN users u ON up.user_id = u.id 
    WHERE up.user_id = ?
  `;

  req.db.query(sql, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching user profile: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ profile: results[0] });
  });
});

// Create or update user profile
app.post('/user/profile', authenticateToken, upload.single('profile_photo'), (req, res) => {
  const { username, age, gender, phone, course } = req.body;
  const userId = req.user.userId;
  let profile_photo = null;

  if (req.file) {
    profile_photo = req.file.filename;
  }

  // Check if profile already exists
  const checkSql = 'SELECT * FROM user_profile WHERE user_id = ?';
  req.db.query(checkSql, [userId], (err, results) => {
    if (err) {
      console.error('Error checking user profile: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Update existing profile
      let updateSql, updateParams;

      if (profile_photo) {
        updateSql = `
          UPDATE user_profile 
          SET username = ?, age = ?, gender = ?, phone = ?, course = ?, profile_photo = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ?
        `;
        updateParams = [username, age, gender, phone, course, profile_photo, userId];
      } else {
        updateSql = `
          UPDATE user_profile 
          SET username = ?, age = ?, gender = ?, phone = ?, course = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ?
        `;
        updateParams = [username, age, gender, phone, course, userId];
      }

      req.db.query(updateSql, updateParams, (err) => {
        if (err) {
          console.error('Error updating user profile: ', err);
          return res.status(500).json({ error: 'Error updating profile' });
        }

        res.json({ message: 'Profile updated successfully' });
      });
    } else {
      // Create new profile
      const insertSql = `
        INSERT INTO user_profile (user_id, username, age, gender, phone, course, profile_photo) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      req.db.query(insertSql, [userId, username, age, gender, phone, course, profile_photo], (err) => {
        if (err) {
          console.error('Error creating user profile: ', err);
          return res.status(500).json({ error: 'Error creating profile' });
        }

        res.json({ message: 'Profile created successfully' });
      });
    }
  });
});

// User University Routes

// Get user universities
app.get('/user/universities', authenticateToken, (req, res) => {
  const sql = 'SELECT * FROM user_university WHERE user_id = ? ORDER BY created_at DESC';

  req.db.query(sql, [req.user.userId], (err, results) => {
    if (err) {
      console.error('Error fetching user universities: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ universities: results });
  });
});

// Add user university
app.post('/user/universities', authenticateToken, (req, res) => {
  const { university_id, university_name, application_status } = req.body;
  const userId = req.user.userId;

  const sql = `
    INSERT INTO user_university (user_id, university_id, university_name, application_status) 
    VALUES (?, ?, ?, ?)
  `;

  req.db.query(sql, [userId, university_id, university_name, application_status || 'Interested'], (err, results) => {
    if (err) {
      console.error('Error adding user university: ', err);
      return res.status(500).json({ error: 'Error adding university' });
    }

    res.json({ message: 'University added successfully', id: results.insertId });
  });
});

// Update user university status
app.put('/user/universities/:id', authenticateToken, (req, res) => {
  const { application_status } = req.body;
  const universityId = req.params.id;
  const userId = req.user.userId;

  const sql = 'UPDATE user_university SET application_status = ? WHERE id = ? AND user_id = ?';

  req.db.query(sql, [application_status, universityId, userId], (err, results) => {
    if (err) {
      console.error('Error updating university status: ', err);
      return res.status(500).json({ error: 'Error updating university status' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json({ message: 'University status updated successfully' });
  });
});

// Delete user university
app.delete('/user/universities/:id', authenticateToken, (req, res) => {
  const universityId = req.params.id;
  const userId = req.user.userId;

  const sql = 'DELETE FROM user_university WHERE id = ? AND user_id = ?';

  req.db.query(sql, [universityId, userId], (err, results) => {
    if (err) {
      console.error('Error deleting university: ', err);
      return res.status(500).json({ error: 'Error deleting university' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json({ message: 'University deleted successfully' });
  });
});

// Admin Routes

// Get admin profile
app.get('/admin/profile', authenticateAdmin, (req, res) => {
  const sql = `
    SELECT ap.*, a.first_name, a.last_name, a.email 
    FROM admin_profile ap 
    JOIN admins a ON ap.admin_id = a.id 
    WHERE ap.admin_id = ?
  `;

  req.db.query(sql, [req.admin.adminId], (err, results) => {
    if (err) {
      console.error('Error fetching admin profile: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    res.json({ profile: results[0] });
  });
});

// Create or update admin profile
app.post('/admin/profile', authenticateAdmin, upload.single('profile_photo'), (req, res) => {
  const { username, age, gender, phone, admin_pin } = req.body;
  const adminId = req.admin.adminId;
  let profile_photo = null;

  if (req.file) {
    profile_photo = req.file.filename;
  }

  // Check if profile already exists
  const checkSql = 'SELECT * FROM admin_profile WHERE admin_id = ?';
  req.db.query(checkSql, [adminId], (err, results) => {
    if (err) {
      console.error('Error checking admin profile: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      // Update existing profile
      let updateSql, updateParams;

      if (profile_photo) {
        updateSql = `
          UPDATE admin_profile 
          SET username = ?, age = ?, gender = ?, phone = ?, admin_pin = ?, profile_photo = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE admin_id = ?
        `;
        updateParams = [username, age, gender, phone, admin_pin, profile_photo, adminId];
      } else {
        updateSql = `
          UPDATE admin_profile 
          SET username = ?, age = ?, gender = ?, phone = ?, admin_pin = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE admin_id = ?
        `;
        updateParams = [username, age, gender, phone, admin_pin, adminId];
      }

      req.db.query(updateSql, updateParams, (err) => {
        if (err) {
          console.error('Error updating admin profile: ', err);
          return res.status(500).json({ error: 'Error updating profile' });
        }

        res.json({ message: 'Profile updated successfully' });
      });
    } else {
      // Create new profile
      const insertSql = `
        INSERT INTO admin_profile (admin_id, username, age, gender, phone, admin_pin, profile_photo) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      req.db.query(insertSql, [adminId, username, age, gender, phone, admin_pin, profile_photo], (err) => {
        if (err) {
          console.error('Error creating admin profile: ', err);
          return res.status(500).json({ error: 'Error creating profile' });
        }

        res.json({ message: 'Profile created successfully' });
      });
    }
  });
});

// Get all users for admin
app.get('/admin/users', authenticateAdmin, (req, res) => {
  const sql = `
    SELECT u.id, u.first_name, u.last_name, u.email, u.created_at,
           up.username, up.age, up.gender, up.phone, up.course, up.profile_photo
    FROM users u
    LEFT JOIN user_profile up ON u.id = up.user_id
    ORDER BY u.created_at DESC
  `;

  req.db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users: ', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ users: results });
  });
});

// Delete user account (by admin or user themselves)
app.delete('/user/delete/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const isAdmin = req.user.role === 'admin';

  // Check if user has permission to delete this account
  if (!isAdmin && userId != req.user.userId) {
    return res.status(403).json({ error: 'You can only delete your own account' });
  }

  const deleteSql = 'DELETE FROM users WHERE id = ?';

  req.db.query(deleteSql, [userId], (err, results) => {
    if (err) {
      console.error('Error deleting user: ', err);
      return res.status(500).json({ error: 'Error deleting account' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  });
});

// Add a separate route for users to delete their own account without specifying ID
app.delete('/user/delete', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  const deleteSql = 'DELETE FROM users WHERE id = ?';

  req.db.query(deleteSql, [userId], (err, results) => {
    if (err) {
      console.error('Error deleting user: ', err);
      return res.status(500).json({ error: 'Error deleting account' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  });
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  if (app.locals.db) {
    res.json({ status: 'OK', database: 'Connected' });
  } else {
    res.status(503).json({ status: 'Error', database: 'Disconnected' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server gracefully');
  if (app.locals.db) {
    app.locals.db.end((err) => {
      if (err) {
        console.error('Error closing database connection: ', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});