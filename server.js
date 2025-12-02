// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const mysql = require("mysql2");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const path = require("path");
// const multer = require("multer");
// const fs = require("fs");

// dotenv.config();

// const app = express();
// app.use(express.json());

// // --------------------
// // Connect to MongoDB
// // --------------------
// mongoose
//   .connect(process.env.mongo_uri)
//   .then(() => console.log("✅ MongoDB Connected Successfully"))
//   .catch((err) => console.error("❌ MongoDB Connection Error:", err));


// const User = mongoose.model(
//   "User",
//   new mongoose.Schema({}, { collection: "users" })
// );

// mongoose.connection.once("open", async () => {
//   console.log("📁 Fetching documents from SAM.users...");

//   try {
//     const docs = await User.find();
//     console.log("📌 Documents in users collection:", docs);
//   } catch (err) {
//     console.error("❌ Error fetching docs:", err);
//   }
// });

// const port = 5000;
// const JWT_SECRET = 'your-secret-key'; // Change this in production

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = 'uploads/';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image files are allowed!'), false);
//     }
//   }
// });

// // First connect without database specified
// const config = {
//   host: 'localhost',
//   user: 'root', // Replace with your MySQL username
//   password: '1234567', // Replace with your MySQL password
// };

// // Create initial connection
// const initialConnection = mysql.createConnection(config);

// // Check and create database if it doesn't exist
// initialConnection.connect((err) => {
//   if (err) {
//     console.error('Initial connection failed: ', err);
//     process.exit(1);
//   }

//   console.log('Connected to MySQL server');

//   // Create database if it doesn't exist
//   initialConnection.query("CREATE DATABASE IF NOT EXISTS SAM", (err) => {
//     if (err) {
//       console.error('Error creating database: ', err);
//       process.exit(1);
//     }

//     console.log('SAM database ready');

//     // Close initial connection
//     initialConnection.end();

//     // Now connect to the SAM database
//     connectToDatabase();
//   });
// });

// // Connect to SAM database
// function connectToDatabase() {
//   const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '1234567',
//     database: 'SAM'
//   });

//   db.connect((err) => {
//     if (err) {
//       console.error('Database connection failed: ', err);
//       return;
//     }
//     console.log('Connected to SAM database');

//     // Check if tables exist, if not create them
//     checkAndCreateTables(db);

//     // Set the db connection to app for use in routes
//     app.locals.db = db;
//   });
// }

// // Function to check if tables exist and create them if needed
// function checkAndCreateTables(db) {
//   // Create users table for authentication
//   const createUsersTable = () => {
//     const sql = `
//       CREATE TABLE IF NOT EXISTS users (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         first_name VARCHAR(50) NOT NULL,
//         last_name VARCHAR(50) NOT NULL,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//     db.query(sql, (err) => {
//       if (err) {
//         console.error('Error creating users table: ', err);
//       } else {
//         console.log('Users table ready');
//       }
//     });
//   };

//   // Create admins table for admin authentication
//   const createAdminsTable = () => {
//     const sql = `
//       CREATE TABLE IF NOT EXISTS admins (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         first_name VARCHAR(50) NOT NULL,
//         last_name VARCHAR(50) NOT NULL,
//         email VARCHAR(100) UNIQUE NOT NULL,
//         password VARCHAR(255) NOT NULL,
//         admin_pin VARCHAR(10) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//     db.query(sql, (err) => {
//       if (err) {
//         console.error('Error creating admins table: ', err);
//       } else {
//         console.log('Admins table ready');
//         createDefaultAdmin(db);
//       }
//     });
//   };

//   // Create user_profile table
//   const createUserProfileTable = () => {
//     const sql = `
//       CREATE TABLE IF NOT EXISTS user_profile (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         user_id INT NOT NULL,
//         username VARCHAR(50) UNIQUE,
//         age INT,
//         gender ENUM('Male', 'Female', 'Other'),
//         phone VARCHAR(20),
//         profile_photo VARCHAR(255),
//         course VARCHAR(100),
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//       )
//     `;

//     db.query(sql, (err) => {
//       if (err) {
//         console.error('Error creating user_profile table: ', err);
//       } else {
//         console.log('User_profile table ready');
//       }
//     });
//   };

//   // Create user_university table
//   const createUserUniversityTable = () => {
//     const sql = `
//       CREATE TABLE IF NOT EXISTS user_university (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         user_id INT NOT NULL,
//         university_id VARCHAR(50),
//         university_name VARCHAR(255) NOT NULL,
//         application_status ENUM('Interested', 'Applied', 'Accepted', 'Rejected') DEFAULT 'Interested',
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//       )
//     `;

//     db.query(sql, (err) => {
//       if (err) {
//         console.error('Error creating user_university table: ', err);
//       } else {
//         console.log('User_university table ready');
//       }
//     });
//   };

//   // Create admin_profile table
//   const createAdminProfileTable = () => {
//     const sql = `
//       CREATE TABLE IF NOT EXISTS admin_profile (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         admin_id INT NOT NULL,
//         username VARCHAR(50) UNIQUE,
//         age INT,
//         gender ENUM('Male', 'Female', 'Other'),
//         phone VARCHAR(20),
//         profile_photo VARCHAR(255),
//         admin_pin VARCHAR(10) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
//       )
//     `;

//     db.query(sql, (err) => {
//       if (err) {
//         console.error('Error creating admin_profile table: ', err);
//       } else {
//         console.log('Admin_profile table ready');
//       }
//     });
//   };

//   // Create admin_userlist table
//   const createAdminUserlistTable = () => {
//     const sql = `
//       CREATE TABLE IF NOT EXISTS admin_userlist (
//         id INT AUTO_INCREMENT PRIMARY KEY,
//         user_id INT NOT NULL,
//         first_name VARCHAR(50) NOT NULL,
//         last_name VARCHAR(50) NOT NULL,
//         email VARCHAR(100) NOT NULL,
//         username VARCHAR(50),
//         age INT,
//         gender ENUM('Male', 'Female', 'Other'),
//         phone VARCHAR(20),
//         course VARCHAR(100),
//         profile_photo VARCHAR(255),
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//       )
//     `;

//     db.query(sql, (err) => {
//       if (err) {
//         console.error('Error creating admin_userlist table: ', err);
//       } else {
//         console.log('Admin_userlist table ready');
//       }
//     });
//   };

//   // Create a default admin account if no admins exist
//   const createDefaultAdmin = (db) => {
//     const checkSql = 'SELECT COUNT(*) as count FROM admins';
//     db.query(checkSql, async (err, results) => {
//       if (err) {
//         console.error('Error checking admin count: ', err);
//         return;
//       }

//       if (results[0].count === 0) {
//         try {
//           const hashedPassword = await bcrypt.hash('admin123', 10);
//           db.query(
//             `INSERT INTO admins (first_name, last_name, email, password, admin_pin) VALUES (?, ?, ?, ?, ?)`,
//             ['Raja', 'Mishra', 'raja@gmail.com', '191394', '19113'],
//             (err) => {
//               if (err) {
//                 console.error('Error creating default admin: ', err);
//               } else {
//                 console.log('Default admin account created');
//               }
//             }
//           );
//         } catch (error) {
//           console.error('Error hashing password for default admin: ', error);
//         }
//       }
//     });
//   };

//   // Check and create all tables
//   createUsersTable();
//   createAdminsTable();
//   createUserProfileTable();
//   createUserUniversityTable();
//   createAdminProfileTable();
//   createAdminUserlistTable();
// }

// // Middleware to get database connection
// app.use((req, res, next) => {
//   if (!app.locals.db) {
//     return res.status(503).json({ error: 'Database not connected. Please try again later.' });
//   }
//   req.db = app.locals.db;
//   next();
// });

// // Middleware to verify JWT token for users
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//   if (!token) {
//     return res.status(401).json({ error: 'Access token required' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: 'Invalid or expired token' });
//     }
//     req.user = user;
//     next();
//   });
// };

// // Middleware to verify JWT token for admins
// const authenticateAdmin = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//   if (!token) {
//     return res.status(401).json({ error: 'Access token required' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, admin) => {
//     if (err) {
//       return res.status(403).json({ error: 'Invalid or expired token' });
//     }

//     if (!admin.adminId) {
//       return res.status(403).json({ error: 'Admin access required' });
//     }

//     req.admin = admin;
//     next();
//   });
// };

// // Serve the signin page
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'signin.html'));
// });

// // Authentication Routes

// // Register a new user
// app.post('/auth/register', async (req, res) => {
//   const { first_name, last_name, email, password } = req.body;

//   // Basic validation
//   if (!first_name || !last_name || !email || !password) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   if (password.length < 6) {
//     return res.status(400).json({ error: 'Password must be at least 6 characters' });
//   }

//   // Check if user already exists
//   const checkSql = 'SELECT * FROM users WHERE email = ?';
//   req.db.query(checkSql, [email], async (err, results) => {
//     if (err) {
//       console.error('Error checking user: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length > 0) {
//       return res.status(409).json({ error: 'User already exists with this email' });
//     }

//     try {
//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Insert user into database
//       const insertSql = 'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
//       req.db.query(insertSql, [first_name, last_name, email, hashedPassword], (err, results) => {
//         if (err) {
//           console.error('Error creating user: ', err);
//           return res.status(500).json({ error: 'Error creating user' });
//         }

//         // Generate JWT token
//         const token = jwt.sign(
//           { userId: results.insertId, email: email, role: 'user' },
//           JWT_SECRET,
//           { expiresIn: '24h' }
//         );

//         res.json({
//           message: 'User registered successfully',
//           userId: results.insertId,
//           token: token
//         });
//       });
//     } catch (error) {
//       console.error('Error hashing password: ', error);
//       return res.status(500).json({ error: 'Server error' });
//     }
//   });
// });

// // Register a new admin
// app.post('/admin/register', async (req, res) => {
//   const { first_name, last_name, email, password, admin_pin } = req.body;

//   // Basic validation
//   if (!first_name || !last_name || !email || !password || !admin_pin) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   if (password.length < 6) {
//     return res.status(400).json({ error: 'Password must be at least 6 characters' });
//   }

//   // Check if admin already exists
//   const checkSql = 'SELECT * FROM admins WHERE email = ?';
//   req.db.query(checkSql, [email], async (err, results) => {
//     if (err) {
//       console.error('Error checking admin: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length > 0) {
//       return res.status(409).json({ error: 'Admin already exists with this email' });
//     }

//     try {
//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 10);

//       // Insert admin into database
//       const insertSql = 'INSERT INTO admins (first_name, last_name, email, password, admin_pin) VALUES (?, ?, ?, ?, ?)';
//       req.db.query(insertSql, [first_name, last_name, email, hashedPassword, admin_pin], (err, results) => {
//         if (err) {
//           console.error('Error creating admin: ', err);
//           return res.status(500).json({ error: 'Error creating admin' });
//         }

//         // Generate JWT token
//         const token = jwt.sign(
//           { adminId: results.insertId, email: email, role: 'admin' },
//           JWT_SECRET,
//           { expiresIn: '24h' }
//         );

//         res.json({
//           message: 'Admin registered successfully',
//           adminId: results.insertId,
//           token: token
//         });
//       });
//     } catch (error) {
//       console.error('Error hashing password: ', error);
//       return res.status(500).json({ error: 'Server error' });
//     }
//   });
// });

// // Login user
// app.post('/auth/login', (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   const sql = 'SELECT * FROM users WHERE email = ?';
//   req.db.query(sql, [email], async (err, results) => {
//     if (err) {
//       console.error('Error logging in: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length === 0) {
//       return res.status(401).json({ error: 'Invalid email or password' });
//     }

//     const user = results[0];

//     try {
//       // Compare passwords
//       const isMatch = await bcrypt.compare(password, user.password);

//       if (!isMatch) {
//         return res.status(401).json({ error: 'Invalid email or password' });
//       }

//       // Generate JWT token
//       const token = jwt.sign(
//         { userId: user.id, email: user.email, role: 'user' },
//         JWT_SECRET,
//         { expiresIn: '24h' }
//       );

//       res.json({
//         message: 'Login successful',
//         token: token,
//         user: {
//           id: user.id,
//           first_name: user.first_name,
//           last_name: user.last_name,
//           email: user.email,
//           role: 'user'
//         }
//       });
//     } catch (error) {
//       console.error('Error comparing passwords: ', error);
//       return res.status(500).json({ error: 'Server error' });
//     }
//   });
// });

// // Admin login
// app.post('/admin/login', (req, res) => {
//   const { email, password, admin_pin } = req.body;

//   if (!email || !password || !admin_pin) {
//     return res.status(400).json({ error: 'Email, password and admin PIN are required' });
//   }

//   const sql = 'SELECT * FROM admins WHERE email = ?';
//   req.db.query(sql, [email], async (err, results) => {
//     if (err) {
//       console.error('Error with admin login: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length === 0) {
//       return res.status(401).json({ error: 'Invalid email or password' });
//     }

//     const admin = results[0];

//     // Check admin PIN
//     if (admin_pin !== admin.admin_pin) {
//       return res.status(401).json({ error: 'Invalid admin PIN' });
//     }

//     try {
//       // Compare passwords
//       const isMatch = await bcrypt.compare(password, admin.password);

//       if (!isMatch) {
//         return res.status(401).json({ error: 'Invalid email or password' });
//       }

//       // Generate JWT token
//       const token = jwt.sign(
//         {
//           adminId: admin.id,
//           email: admin.email,
//           role: 'admin'
//         },
//         JWT_SECRET,
//         { expiresIn: '24h' }
//       );

//       res.json({
//         message: 'Admin login successful',
//         token: token,
//         admin: {
//           id: admin.id,
//           first_name: admin.first_name,
//           last_name: admin.last_name,
//           email: admin.email,
//           role: 'admin'
//         }
//       });
//     } catch (error) {
//       console.error('Error comparing passwords: ', error);
//       return res.status(500).json({ error: 'Server error' });
//     }
//   });
// });

// // User Profile Routes

// // Get user profile
// app.get('/user/profile', authenticateToken, (req, res) => {
//   const sql = `
//     SELECT up.*, u.first_name, u.last_name, u.email 
//     FROM user_profile up 
//     JOIN users u ON up.user_id = u.id 
//     WHERE up.user_id = ?
//   `;

//   req.db.query(sql, [req.user.userId], (err, results) => {
//     if (err) {
//       console.error('Error fetching user profile: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'User profile not found' });
//     }

//     res.json({ profile: results[0] });
//   });
// });

// // Create or update user profile
// app.post('/user/profile', authenticateToken, upload.single('profile_photo'), (req, res) => {
//   const { username, age, gender, phone, course } = req.body;
//   const userId = req.user.userId;
//   let profile_photo = null;

//   if (req.file) {
//     profile_photo = req.file.filename;
//   }

//   // Check if profile already exists
//   const checkSql = 'SELECT * FROM user_profile WHERE user_id = ?';
//   req.db.query(checkSql, [userId], (err, results) => {
//     if (err) {
//       console.error('Error checking user profile: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length > 0) {
//       // Update existing profile
//       let updateSql, updateParams;

//       if (profile_photo) {
//         updateSql = `
//           UPDATE user_profile 
//           SET username = ?, age = ?, gender = ?, phone = ?, course = ?, profile_photo = ?, updated_at = CURRENT_TIMESTAMP 
//           WHERE user_id = ?
//         `;
//         updateParams = [username, age, gender, phone, course, profile_photo, userId];
//       } else {
//         updateSql = `
//           UPDATE user_profile 
//           SET username = ?, age = ?, gender = ?, phone = ?, course = ?, updated_at = CURRENT_TIMESTAMP 
//           WHERE user_id = ?
//         `;
//         updateParams = [username, age, gender, phone, course, userId];
//       }

//       req.db.query(updateSql, updateParams, (err) => {
//         if (err) {
//           console.error('Error updating user profile: ', err);
//           return res.status(500).json({ error: 'Error updating profile' });
//         }

//         res.json({ message: 'Profile updated successfully' });
//       });
//     } else {
//       // Create new profile
//       const insertSql = `
//         INSERT INTO user_profile (user_id, username, age, gender, phone, course, profile_photo) 
//         VALUES (?, ?, ?, ?, ?, ?, ?)
//       `;

//       req.db.query(insertSql, [userId, username, age, gender, phone, course, profile_photo], (err) => {
//         if (err) {
//           console.error('Error creating user profile: ', err);
//           return res.status(500).json({ error: 'Error creating profile' });
//         }

//         res.json({ message: 'Profile created successfully' });
//       });
//     }
//   });
// });

// // User University Routes

// // Get user universities
// app.get('/user/universities', authenticateToken, (req, res) => {
//   const sql = 'SELECT * FROM user_university WHERE user_id = ? ORDER BY created_at DESC';

//   req.db.query(sql, [req.user.userId], (err, results) => {
//     if (err) {
//       console.error('Error fetching user universities: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     res.json({ universities: results });
//   });
// });

// // Add user university
// app.post('/user/universities', authenticateToken, (req, res) => {
//   const { university_id, university_name, application_status } = req.body;
//   const userId = req.user.userId;

//   const sql = `
//     INSERT INTO user_university (user_id, university_id, university_name, application_status) 
//     VALUES (?, ?, ?, ?)
//   `;

//   req.db.query(sql, [userId, university_id, university_name, application_status || 'Interested'], (err, results) => {
//     if (err) {
//       console.error('Error adding user university: ', err);
//       return res.status(500).json({ error: 'Error adding university' });
//     }

//     res.json({ message: 'University added successfully', id: results.insertId });
//   });
// });

// // Update user university status
// app.put('/user/universities/:id', authenticateToken, (req, res) => {
//   const { application_status } = req.body;
//   const universityId = req.params.id;
//   const userId = req.user.userId;

//   const sql = 'UPDATE user_university SET application_status = ? WHERE id = ? AND user_id = ?';

//   req.db.query(sql, [application_status, universityId, userId], (err, results) => {
//     if (err) {
//       console.error('Error updating university status: ', err);
//       return res.status(500).json({ error: 'Error updating university status' });
//     }

//     if (results.affectedRows === 0) {
//       return res.status(404).json({ error: 'University not found' });
//     }

//     res.json({ message: 'University status updated successfully' });
//   });
// });

// // Delete user university
// app.delete('/user/universities/:id', authenticateToken, (req, res) => {
//   const universityId = req.params.id;
//   const userId = req.user.userId;

//   const sql = 'DELETE FROM user_university WHERE id = ? AND user_id = ?';

//   req.db.query(sql, [universityId, userId], (err, results) => {
//     if (err) {
//       console.error('Error deleting university: ', err);
//       return res.status(500).json({ error: 'Error deleting university' });
//     }

//     if (results.affectedRows === 0) {
//       return res.status(404).json({ error: 'University not found' });
//     }

//     res.json({ message: 'University deleted successfully' });
//   });
// });

// // Admin Routes

// // Get admin profile
// app.get('/admin/profile', authenticateAdmin, (req, res) => {
//   const sql = `
//     SELECT ap.*, a.first_name, a.last_name, a.email 
//     FROM admin_profile ap 
//     JOIN admins a ON ap.admin_id = a.id 
//     WHERE ap.admin_id = ?
//   `;

//   req.db.query(sql, [req.admin.adminId], (err, results) => {
//     if (err) {
//       console.error('Error fetching admin profile: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ error: 'Admin profile not found' });
//     }

//     res.json({ profile: results[0] });
//   });
// });

// // Create or update admin profile
// app.post('/admin/profile', authenticateAdmin, upload.single('profile_photo'), (req, res) => {
//   const { username, age, gender, phone, admin_pin } = req.body;
//   const adminId = req.admin.adminId;
//   let profile_photo = null;

//   if (req.file) {
//     profile_photo = req.file.filename;
//   }

//   // Check if profile already exists
//   const checkSql = 'SELECT * FROM admin_profile WHERE admin_id = ?';
//   req.db.query(checkSql, [adminId], (err, results) => {
//     if (err) {
//       console.error('Error checking admin profile: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     if (results.length > 0) {
//       // Update existing profile
//       let updateSql, updateParams;

//       if (profile_photo) {
//         updateSql = `
//           UPDATE admin_profile 
//           SET username = ?, age = ?, gender = ?, phone = ?, admin_pin = ?, profile_photo = ?, updated_at = CURRENT_TIMESTAMP 
//           WHERE admin_id = ?
//         `;
//         updateParams = [username, age, gender, phone, admin_pin, profile_photo, adminId];
//       } else {
//         updateSql = `
//           UPDATE admin_profile 
//           SET username = ?, age = ?, gender = ?, phone = ?, admin_pin = ?, updated_at = CURRENT_TIMESTAMP 
//           WHERE admin_id = ?
//         `;
//         updateParams = [username, age, gender, phone, admin_pin, adminId];
//       }

//       req.db.query(updateSql, updateParams, (err) => {
//         if (err) {
//           console.error('Error updating admin profile: ', err);
//           return res.status(500).json({ error: 'Error updating profile' });
//         }

//         res.json({ message: 'Profile updated successfully' });
//       });
//     } else {
//       // Create new profile
//       const insertSql = `
//         INSERT INTO admin_profile (admin_id, username, age, gender, phone, admin_pin, profile_photo) 
//         VALUES (?, ?, ?, ?, ?, ?, ?)
//       `;

//       req.db.query(insertSql, [adminId, username, age, gender, phone, admin_pin, profile_photo], (err) => {
//         if (err) {
//           console.error('Error creating admin profile: ', err);
//           return res.status(500).json({ error: 'Error creating profile' });
//         }

//         res.json({ message: 'Profile created successfully' });
//       });
//     }
//   });
// });

// // Get all users for admin
// app.get('/admin/users', authenticateAdmin, (req, res) => {
//   const sql = `
//     SELECT u.id, u.first_name, u.last_name, u.email, u.created_at,
//            up.username, up.age, up.gender, up.phone, up.course, up.profile_photo
//     FROM users u
//     LEFT JOIN user_profile up ON u.id = up.user_id
//     ORDER BY u.created_at DESC
//   `;

//   req.db.query(sql, (err, results) => {
//     if (err) {
//       console.error('Error fetching users: ', err);
//       return res.status(500).json({ error: 'Database error' });
//     }

//     res.json({ users: results });
//   });
// });

// // Delete user account (by admin or user themselves)
// app.delete('/user/delete/:id', authenticateToken, (req, res) => {
//   const userId = req.params.id;
//   const isAdmin = req.user.role === 'admin';

//   // Check if user has permission to delete this account
//   if (!isAdmin && userId != req.user.userId) {
//     return res.status(403).json({ error: 'You can only delete your own account' });
//   }

//   const deleteSql = 'DELETE FROM users WHERE id = ?';

//   req.db.query(deleteSql, [userId], (err, results) => {
//     if (err) {
//       console.error('Error deleting user: ', err);
//       return res.status(500).json({ error: 'Error deleting account' });
//     }

//     if (results.affectedRows === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({ message: 'Account deleted successfully' });
//   });
// });

// // Get user universities for admin view
// app.get('/admin/user-universities/:userId', authenticateAdmin, (req, res) => {
//     const userId = req.params.userId;
    
//     const sql = 'SELECT * FROM user_university WHERE user_id = ? ORDER BY created_at DESC';
    
//     req.db.query(sql, [userId], (err, results) => {
//         if (err) {
//             console.error('Error fetching user universities: ', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
        
//         res.json({ universities: results });
//     });
// });

// // Get all applications for admin dashboard
// app.get('/admin/all-applications', authenticateAdmin, (req, res) => {
//     const sql = `
//         SELECT uu.*, u.first_name, u.last_name, u.email, up.username, up.age, up.gender, up.course, up.profile_photo
//         FROM user_university uu 
//         JOIN users u ON uu.user_id = u.id 
//         LEFT JOIN user_profile up ON u.id = up.user_id
//         ORDER BY uu.created_at DESC
//     `;
    
//     req.db.query(sql, (err, results) => {
//         if (err) {
//             console.error('Error fetching all applications: ', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
        
//         res.json({ applications: results });
//     });
// });

// // Update application status
// app.put('/admin/application/:id', authenticateAdmin, (req, res) => {
//     const applicationId = req.params.id;
//     const { application_status } = req.body;
    
//     const sql = 'UPDATE user_university SET application_status = ? WHERE id = ?';
    
//     req.db.query(sql, [application_status, applicationId], (err, results) => {
//         if (err) {
//             console.error('Error updating application status: ', err);
//             return res.status(500).json({ error: 'Database error' });
//         }
        
//         if (results.affectedRows === 0) {
//             return res.status(404).json({ error: 'Application not found' });
//         }
        
//         res.json({ message: 'Application status updated successfully' });
//     });
// });

// // Add a separate route for users to delete their own account without specifying ID
// app.delete('/user/delete', authenticateToken, (req, res) => {
//   const userId = req.user.userId;

//   const deleteSql = 'DELETE FROM users WHERE id = ?';

//   req.db.query(deleteSql, [userId], (err, results) => {
//     if (err) {
//       console.error('Error deleting user: ', err);
//       return res.status(500).json({ error: 'Error deleting account' });
//     }

//     if (results.affectedRows === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json({ message: 'Account deleted successfully' });
//   });
// });

// // Logout endpoint
// app.post('/auth/logout', (req, res) => {
//   res.json({ message: 'Logout successful' });
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   if (app.locals.db) {
//     res.json({ status: 'OK', database: 'Connected' });
//   } else {
//     res.status(503).json({ status: 'Error', database: 'Disconnected' });
//   }
// });

// // Start server
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

// // Handle graceful shutdown
// process.on('SIGINT', () => {
//   console.log('\nShutting down server gracefully');
//   if (app.locals.db) {
//     app.locals.db.end((err) => {
//       if (err) {
//         console.error('Error closing database connection: ', err);
//       } else {
//         console.log('Database connection closed');
//       }
//       process.exit(0);
//     });
//   } else {
//     process.exit(0);
//   }
// });


const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(express.json());

// --------------------
// Connect to MongoDB
// --------------------
mongoose
  .connect(process.env.mongo_uri, {
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    retryWrites: true,
    w: 'majority'
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📊 Host:", mongoose.connection.host);
    console.log("📁 Database:", mongoose.connection.db.databaseName);
    
    // Verify connection by listing collections
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log("📋 Collections found:", collections.map(c => c.name));
    return createDefaultAdmin();
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Check if connection string is correct");
    console.log("2. Check if IP is whitelisted in MongoDB Atlas");
    console.log("3. Try connecting with MongoDB Compass first");
    console.log("4. Your connection string should look like:");
    console.log("   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/SAM?retryWrites=true&w=majority");
    process.exit(1);
  });


// --------------------
// MongoDB Schemas
// --------------------

// User Schema
const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  admin_pin: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  phone: String,
  profile_photo: String,
  course: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// User University Schema
const userUniversitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  university_id: String,
  university_name: {
    type: String,
    required: true
  },
  application_status: {
    type: String,
    enum: ['Interested', 'Applied', 'Accepted', 'Rejected'],
    default: 'Interested'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Admin Profile Schema
const adminProfileSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true
  },
  age: Number,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  phone: String,
  profile_photo: String,
  admin_pin: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const UserUniversity = mongoose.model('UserUniversity', userUniversitySchema);
const AdminProfile = mongoose.model('AdminProfile', adminProfileSchema);

const port = 5000;

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

// Create default admin if none exists
async function createDefaultAdmin() {
  try {
    const adminCount = await Admin.countDocuments();
    
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash('191394', 10);
      
      const defaultAdmin = new Admin({
        first_name: 'Raja',
        last_name: 'Mishra',
        email: 'raja@gmail.com',
        password: hashedPassword,
        admin_pin: '19113'
      });
      
      await defaultAdmin.save();
      console.log('✅ Default admin account created');
    }
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
}

// Initialize database
mongoose.connection.once('open', async () => {
  console.log('📁 MongoDB connection established');
  await createDefaultAdmin();
});

// Simple authentication middleware
const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  req.userId = userId;
  next();
};

const authenticateAdmin = (req, res, next) => {
  const adminId = req.headers['admin-id'];
  if (!adminId) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  req.adminId = adminId;
  next();
};

// Serve the signin page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// ====================
// Authentication Routes
// ====================

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

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      first_name,
      last_name,
      email,
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    res.json({
      message: 'User registered successfully',
      userId: savedUser._id
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error' });
  }
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

  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ error: 'Admin already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      admin_pin
    });

    const savedAdmin = await newAdmin.save();

    res.json({
      message: 'Admin registered successfully',
      adminId: savedAdmin._id
    });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin login
app.post('/admin/login', async (req, res) => {
  const { email, password, admin_pin } = req.body;

  if (!email || !password || !admin_pin) {
    return res.status(400).json({ error: 'Email, password and admin PIN are required' });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check admin PIN
    if (admin_pin !== admin.admin_pin) {
      return res.status(401).json({ error: 'Invalid admin PIN' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Admin login successful',
      admin: {
        id: admin._id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error with admin login:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ====================
// User Profile Routes
// ====================

// Get user profile
app.get('/user/profile', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const userProfile = await UserProfile.findOne({ user_id: userId })
      .populate('user_id', 'first_name last_name email');
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ profile: userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create or update user profile
app.post('/user/profile', upload.single('profile_photo'), async (req, res) => {
  const { username, age, gender, phone, course } = req.body;
  const userId = req.headers['user-id'];
  let profile_photo = null;

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  if (req.file) {
    profile_photo = req.file.filename;
  }

  try {
    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({ user_id: userId });

    if (existingProfile) {
      // Update existing profile
      const updateData = {
        username,
        age,
        gender,
        phone,
        course,
        updated_at: Date.now()
      };

      if (profile_photo) {
        updateData.profile_photo = profile_photo;
      }

      await UserProfile.findOneAndUpdate(
        { user_id: userId },
        updateData,
        { new: true }
      );

      res.json({ message: 'Profile updated successfully' });
    } else {
      // Create new profile
      const newProfile = new UserProfile({
        user_id: userId,
        username,
        age,
        gender,
        phone,
        course,
        profile_photo
      });

      await newProfile.save();
      res.json({ message: 'Profile created successfully' });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// ====================
// User University Routes
// ====================

// Get user universities
app.get('/user/universities', async (req, res) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const universities = await UserUniversity.find({ user_id: userId })
      .sort({ created_at: -1 });

    res.json({ universities });
  } catch (error) {
    console.error('Error fetching user universities:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add user university
app.post('/user/universities', async (req, res) => {
  const { university_id, university_name, application_status } = req.body;
  const userId = req.headers['user-id'];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    // Check if already exists
    const existing = await UserUniversity.findOne({
      user_id: userId,
      university_id: university_id
    });

    if (existing) {
      return res.status(409).json({ error: 'University already in your list' });
    }

    const newUniversity = new UserUniversity({
      user_id: userId,
      university_id,
      university_name,
      application_status: application_status || 'Interested'
    });

    const savedUniversity = await newUniversity.save();

    res.json({
      message: 'University added successfully',
      id: savedUniversity._id
    });
  } catch (error) {
    console.error('Error adding user university:', error);
    res.status(500).json({ error: 'Error adding university' });
  }
});

// Update user university status
app.put('/user/universities/:id', async (req, res) => {
  const { application_status } = req.body;
  const universityId = req.params.id;
  const userId = req.headers['user-id'];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const updated = await UserUniversity.findOneAndUpdate(
      { _id: universityId, user_id: userId },
      { application_status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json({ message: 'University status updated successfully' });
  } catch (error) {
    console.error('Error updating university status:', error);
    res.status(500).json({ error: 'Error updating university status' });
  }
});

// Delete user university
app.delete('/user/universities/:id', async (req, res) => {
  const universityId = req.params.id;
  const userId = req.headers['user-id'];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const deleted = await UserUniversity.findOneAndDelete({
      _id: universityId,
      user_id: userId
    });

    if (!deleted) {
      return res.status(404).json({ error: 'University not found' });
    }

    res.json({ message: 'University deleted successfully' });
  } catch (error) {
    console.error('Error deleting university:', error);
    res.status(500).json({ error: 'Error deleting university' });
  }
});

// ====================
// Admin Routes
// ====================

// Get admin profile
app.get('/admin/profile', async (req, res) => {
  try {
    const adminId = req.headers['admin-id'];
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID required' });
    }
    
    const adminProfile = await AdminProfile.findOne({ admin_id: adminId })
      .populate('admin_id', 'first_name last_name email');
    
    if (!adminProfile) {
      return res.status(404).json({ error: 'Admin profile not found' });
    }

    res.json({ profile: adminProfile });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create or update admin profile
app.post('/admin/profile', upload.single('profile_photo'), async (req, res) => {
  const { username, age, gender, phone, admin_pin } = req.body;
  const adminId = req.headers['admin-id'];
  let profile_photo = null;

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID required' });
  }

  if (req.file) {
    profile_photo = req.file.filename;
  }

  try {
    // Check if profile already exists
    const existingProfile = await AdminProfile.findOne({ admin_id: adminId });

    if (existingProfile) {
      // Update existing profile
      const updateData = {
        username,
        age,
        gender,
        phone,
        admin_pin,
        updated_at: Date.now()
      };

      if (profile_photo) {
        updateData.profile_photo = profile_photo;
      }

      await AdminProfile.findOneAndUpdate(
        { admin_id: adminId },
        updateData,
        { new: true }
      );

      res.json({ message: 'Profile updated successfully' });
    } else {
      // Create new profile
      const newProfile = new AdminProfile({
        admin_id: adminId,
        username,
        age,
        gender,
        phone,
        admin_pin,
        profile_photo
      });

      await newProfile.save();
      res.json({ message: 'Profile created successfully' });
    }
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// Get all users for admin
app.get('/admin/users', async (req, res) => {
  try {
    const adminId = req.headers['admin-id'];
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID required' });
    }

    const users = await User.aggregate([
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: 'user_id',
          as: 'profile'
        }
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          id: '$_id',
          first_name: 1,
          last_name: 1,
          email: 1,
          created_at: 1,
          username: '$profile.username',
          age: '$profile.age',
          gender: '$profile.gender',
          phone: '$profile.phone',
          course: '$profile.course',
          profile_photo: '$profile.profile_photo'
        }
      },
      { $sort: { created_at: -1 } }
    ]);

    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete user account (by admin)
app.delete('/user/delete/:id', async (req, res) => {
  const userId = req.params.id;
  const adminId = req.headers['admin-id'];

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID required' });
  }

  try {
    // Check if admin exists
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(403).json({ error: 'Admin not found' });
    }

    // Delete user and related data
    await User.findByIdAndDelete(userId);
    await UserProfile.deleteMany({ user_id: userId });
    await UserUniversity.deleteMany({ user_id: userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

// User delete their own account
app.delete('/user/delete', async (req, res) => {
  const userId = req.headers['user-id'];

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    await User.findByIdAndDelete(userId);
    await UserProfile.deleteMany({ user_id: userId });
    await UserUniversity.deleteMany({ user_id: userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

// Get user universities for admin view
app.get('/admin/user-universities/:userId', async (req, res) => {
  const userId = req.params.userId;
  const adminId = req.headers['admin-id'];

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID required' });
  }

  try {
    const universities = await UserUniversity.find({ user_id: userId })
      .sort({ created_at: -1 });

    res.json({ universities });
  } catch (error) {
    console.error('Error fetching user universities:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all applications for admin dashboard
app.get('/admin/all-applications', async (req, res) => {
  const adminId = req.headers['admin-id'];

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID required' });
  }

  try {
    const applications = await UserUniversity.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'userprofiles',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'profile'
        }
      },
      {
        $unwind: {
          path: '$profile',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          id: '$_id',
          university_id: 1,
          university_name: 1,
          application_status: 1,
          created_at: 1,
          user_id: 1,
          first_name: '$user.first_name',
          last_name: '$user.last_name',
          email: '$user.email',
          username: '$profile.username',
          age: '$profile.age',
          gender: '$profile.gender',
          course: '$profile.course',
          profile_photo: '$profile.profile_photo'
        }
      },
      { $sort: { created_at: -1 } }
    ]);

    res.json({ applications });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update application status
app.put('/admin/application/:id', async (req, res) => {
  const applicationId = req.params.id;
  const { application_status } = req.body;
  const adminId = req.headers['admin-id'];

  if (!adminId) {
    return res.status(400).json({ error: 'Admin ID required' });
  }

  try {
    const updated = await UserUniversity.findByIdAndUpdate(
      applicationId,
      { application_status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  if (mongoose.connection.readyState === 1) {
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
process.on('SIGINT', async () => {
  console.log('\nShutting down server gracefully');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection: ', err);
  }
  process.exit(0);
});