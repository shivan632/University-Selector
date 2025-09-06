const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = 5000;
const JWT_SECRET = 'your-secret-key'; // Change this in production

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

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
    // Check if users table exists
    db.query("SHOW TABLES LIKE 'users'", (err, results) => {
        if (err) {
            console.error('Error checking users table: ', err);
            return;
        }
        
        if (results.length === 0) {
            // Users table doesn't exist, create it
            createUsersTable(db);
        } else {
            console.log('Users table already exists');
        }
    });
    
    // Check if admins table exists
    db.query("SHOW TABLES LIKE 'admins'", (err, results) => {
        if (err) {
            console.error('Error checking admins table: ', err);
            return;
        }
        
        if (results.length === 0) {
            // Admins table doesn't exist, create it
            createAdminsTable(db);
        } else {
            console.log('Admins table already exists');
        }
    });
}

// Create users table for authentication
const createUsersTable = (db) => {
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
const createAdminsTable = (db) => {
    const sql = `
        CREATE TABLE IF NOT EXISTS admins (
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
            console.error('Error creating admins table: ', err);
        } else {
            console.log('Admins table ready');
            
            // Check if we need to create a default admin account
            createDefaultAdmin(db);
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
                const hashedPassword = await bcrypt.hash('123456', 10);
                db.query(
                    `INSERT INTO admins (first_name, last_name, email, password) VALUES (?, ?, ?, ?)`,
                    ['Shivan', 'Mishra', 'shivrom.2020@gmail.com', hashedPassword],
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
    const { first_name, last_name, email, password } = req.body;
    
    // Basic validation
    if (!first_name || !last_name || !email || !password) {
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
            const insertSql = 'INSERT INTO admins (first_name, last_name, email, password) VALUES (?, ?, ?, ?)';
            req.db.query(insertSql, [first_name, last_name, email, hashedPassword], (err, results) => {
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
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
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

// Protected route example for users
app.get('/auth/profile', authenticateToken, (req, res) => {
    const sql = 'SELECT id, first_name, last_name, email, created_at FROM users WHERE id = ?';
    req.db.query(sql, [req.user.userId], (err, results) => {
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

// Protected route example for admins
app.get('/admin/profile', authenticateAdmin, (req, res) => {
    const sql = 'SELECT id, first_name, last_name, email, created_at FROM admins WHERE id = ?';
    req.db.query(sql, [req.admin.adminId], (err, results) => {
        if (err) {
            console.error('Error fetching admin: ', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }
        
        res.json({ admin: results[0] });
    });
});

// Admin-only route to get all users
app.get('/admin/users', authenticateAdmin, (req, res) => {
    const sql = 'SELECT id, first_name, last_name, email, created_at FROM users ORDER BY created_at DESC';
    req.db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users: ', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ users: results });
    });
});

// Admin-only route to get all admins
app.get('/admin/admins', authenticateAdmin, (req, res) => {
    const sql = 'SELECT id, first_name, last_name, email, created_at FROM admins ORDER BY created_at DESC';
    req.db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching admins: ', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        res.json({ admins: results });
    });
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