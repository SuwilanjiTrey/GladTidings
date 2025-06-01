const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
// Add these to your existing server.js imports
const mammoth = require('mammoth');
//const pdf = require('pdf-parse');

// At the top of server.js
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));





// Middleware to enable CORS
app.use(cors({
  origin: 'http://localhost:3000', // Allow your frontend's origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Serve static files with appropriate headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  next();
}, express.static(path.join(__dirname,'public', 'uploads')));

app.use(express.static(path.join(__dirname, 'public')));





// Middleware to handle JSON data and enable CORS
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // React frontend server
}));

// MySQL connection setup
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bibleapp',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 50,  // Adjust based on your expected concurrent users
  queueLimit: 0,        // Unlimited queueing
  maxIdle: 10           // Maximum number of idle connections
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err);
    return;
  }
  console.log('Successfully connected to the MySQL database');
  
  // Always release the connection back to the pool
  connection.release();
});

// Optional: Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

// Get all posts (Client + Admin)

// Get all posts with course metadata
app.get('/api/posts', (req, res) => {
  const { church } = req.query; // Get church from query parameter

  const sqlQuery = `
    SELECT 
      posts.*,
      courses.title AS course_title,
      courses.church AS course_church
    FROM posts
    JOIN courses ON posts.course_id = courses.course_id
    WHERE courses.church = ?
    ORDER BY posts.created_at DESC
  `;
  
  pool.query(sqlQuery, [church], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
    res.json(results);
  });
});

// Get posts for a specific course
app.get('/api/posts/:courseId', (req, res) => {
  const { courseId } = req.params;
  const sqlQuery = `
    SELECT 
      posts.*, 
      courses.title AS course_title 
    FROM posts
    JOIN courses ON posts.course_id = courses.course_id
    WHERE posts.course_id = ?
    ORDER BY posts.created_at DESC
  `;

  pool.query(sqlQuery, [courseId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch posts for course' });
    }
    res.json(results);
  });
});


// Create a new post (Admin)
const ensureUploadsDirectory = () => {
  const uploadDir = path.join(__dirname,'public','uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  return uploadDir;
};

const cheerio = require('cheerio'); // To parse and manipulate HTML

// Update your post creation endpoint
// Create a new post
app.post('/api/posts', async (req, res) => {
  const { title, content, church, language, course_id, createdBy } = req.body; 
  console.log("data recieved: ", [title, content, church, language, course_id, createdBy])
  ensureUploadsDirectory();

  try {
    const $ = cheerio.load(content);
    const imgTags = $('img');

    for (let i = 0; i < imgTags.length; i++) {
      const img = $(imgTags[i]);
      const src = img.attr('src');

      if (src && src.startsWith('data:image')) {
        const matches = src.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          const imageBuffer = Buffer.from(matches[2], 'base64');
          const imageType = matches[1];
          const filename = `post-image-${Date.now()}-${i}.${imageType}`;
          const filepath = path.join(__dirname, 'public', 'uploads', filename);

          await fs.promises.writeFile(filepath, imageBuffer);

          const newSrc = `/uploads/${filename}`;
          img.attr('src', newSrc);
        }
      }
    }

    const processedContent = $.html();

    const [result] = await pool.promise().query(
      'INSERT INTO posts (title, content, language, church, course_id, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, processedContent, language, church, course_id, createdBy || 1]
    );

    res.json({
      success: true,
      id: result.insertId,
      title,
      content: processedContent,
      language,
      church,
      course_id,
      createdBy: createdBy || 1,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});



// Update a post(ADMIN)
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, course_id } = req.body;

  const sqlQuery = `
    UPDATE posts 
    SET title = ?, content = ?, course_id = ?
    WHERE id = ?
  `;

  pool.query(sqlQuery, [title, content, course_id, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const sqlQuery = `
  DELETE FROM chapter_completion WHERE post_id = ?;
  DELETE FROM posts WHERE id = ?;`;

  pool.query(sqlQuery, [id, id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

//-----------------------------------------check users-----------------

//get users
app.get('/api/users', (req, res) => {
  const sqlQuery = 'SELECT * FROM users ORDER BY user_id DESC';
  pool.query(sqlQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

//get users by church
app.get('/api/users/:churchName', (req, res) => {
  const { churchName } = req.params;

  const sqlQuery = `
    SELECT * FROM users WHERE church = ? ORDER BY user_id DESC`;

  pool.query(sqlQuery, [churchName], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    // Send back the results array
    res.json(results);
  });
});







// Route to verify user credentials before allowing profile update
app.post('/api/users/verify-credentials', async (req, res) => {
  
  const { email, password } = req.body;

  try {
    const [users] = await pool.promise().query('SELECT * FROM users WHERE Email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Return user details without password if credentials are correct
    const { Password, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Credentials verified', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({ message: 'Error verifying credentials', error: error.message });
  }
});

// Route to update user profile
app.put('/api/users/update-profile/:userId', async (req, res) => {

  const { userId } = req.params;
  const { firstName, lastName, mobileNumber, email } = req.body;

  console.log(`data recieved as follows:
    ${userId},
    ${firstName}, 
    ${lastName},
    ${mobileNumber},
    ${email},
    `)

  try {
    const [result] = await pool.promise().query(
      'UPDATE users SET FName = ?, LName = ?, Contact = ?, Email = ? WHERE user_id = ?',
      [firstName, lastName, mobileNumber, email, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch the updated user details
    const [updatedUsers] = await pool.promise().query('SELECT * FROM users WHERE user_id = ?', [userId]);
    const { Password, ...userWithoutPassword } = updatedUsers[0];

    console.log("profile updated successfully")
    res.json({ 
      message: 'Profile updated successfully', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Route to delete user account
app.delete('/api/users/delete-account', async (req, res) => {
  const { userId, email, password } = req.body;

  try {
    // First, verify credentials
    const [users] = await pool.promise().query('SELECT * FROM users WHERE user_id = ? AND Email = ?', [userId, email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Delete user account
    const [result] = await pool.promise().query(`
      DELETE FROM certifications WHERE user_id = ?;
      DELETE FROM quiz_attempts WHERE user_id = ?;
      DELETE FROM course_progress WHERE user_id = ?;
      DELETE FROM chapter_completion WHERE user_id = ?;
      DELETE FROM user_login_history WHERE user_id = ?;
      DELETE FROM users WHERE user_id = ?;
      `, [userId, userId, userId,userId, userId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Failed to delete account' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});


app.delete('/api/users/delete-church', async (req, res) => {
  const { userId, email, church, password } = req.body;
console.log("admin data: ", [userId, email, church])
  try {
    // First, verify credentials
    const [users] = await pool.promise().query('SELECT * FROM users WHERE user_id = ? AND Email = ?', [userId, email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Delete user account
    const [result] = await pool.promise().query(`
      delete from churches where church_name = ? AND elder_id = ?;
      DELETE FROM users WHERE user_id = ?;
      `, [ church, userId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Failed to delete church' });
    }

    res.json({ message: 'church deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

app.get('/api/churches', async (req, res) => {
  try {
    const [churches] = await pool.promise().query('SELECT church_id, church_name FROM churches');
    res.json(churches);
  } catch (error) {
    console.error('Error fetching churches:', error);
    res.status(500).json({ message: 'Error fetching churches' });
  }
});


// Route to handle user signup
const bcrypt = require('bcrypt');
// Updated sign-up route
app.post('/api/users/signup', async (req, res) => {
  const { email, password, firstName, lastName, mobileNumber, language, church } = req.body;

  try {
    const [existingUsers] = await pool.promise().query('SELECT * FROM users WHERE Email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'client'; // Default role for new users

    const [result] = await pool.promise().query(
      'INSERT INTO users (Email, Password, FName, LName, Contact, Role, Region, Church) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, mobileNumber, role, language, church]
    );

    const newUser = { 
      id: result.insertId, 
      email, 
      firstName, 
      lastName, 
      mobileNumber, 
      role,
      language,
      church 
    };
    res.status(201).json({ message: 'User registered successfully', user: newUser });

  } catch (error) {
    console.error('Error during sign-up process:', error.message);
    res.status(500).json({ message: 'Error during sign-up process', error: error.message });
  }
});

// Updated sign-in route
app.post('/api/users/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.promise().query('SELECT * FROM users WHERE Email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const { Password, ...userWithoutPassword } = user;
    res.json({ message: 'Sign in successful', user: userWithoutPassword });
  } catch (error) {
    console.error('Error during sign-in process:', error.message);
    res.status(500).json({ message: 'Error during sign-in process', error: error.message });
  }
});

app.post('/api/users/elder-signup', async (req, res) => {

  const { email, password, firstName, lastName, mobileNumber, language, churchName, churchAddress } = req.body;

  try {

    // Start transaction

    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();


    try {
      // Check if user exists

      const [existingUsers] = await connection.query('SELECT * FROM users WHERE Email = ?', [email]);
      if (existingUsers.length > 0) {
        console.log("user already exists...");
        await connection.rollback();
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert user as subAdmin

      const [userResult] = await connection.query(
        'INSERT INTO users (Email, Password, FName, LName, Contact, Role, Region, Church ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName, mobileNumber, 'subAdmin', language, churchName]
      );

      // Insert church with reference to elder

      const [churchResult] = await connection.query(
        'INSERT INTO churches (church_name, address, contact, elder_id) VALUES (?, ?, ?, ?)',
        [churchName, churchAddress, mobileNumber, userResult.insertId]
      );


      await connection.commit();


      const newUser = { 
        id: userResult.insertId, 
        email, 
        firstName, 
        lastName, 
        role: 'subAdmin' 
      };

      const church = {
        id: churchResult.insertId,
        name: churchName,
        address: churchAddress
      };


      res.status(201).json({ 
        message: 'Church elder registered successfully', 
        user: newUser,
        church: church
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error during church elder sign-up:', error);
    res.status(500).json({ message: 'Error during sign-up process', error: error.message });
  }
});

app.get('/api/users/by-email/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const [user] = await pool.promise().query('SELECT * FROM users WHERE Email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user[0]);
  } catch (error) {
    console.error('Error fetching user by email:', error);
    res.status(500).json({ error: 'Database error' });
  }
});



// New route for Google Sign-In
app.post('/api/users/google-signin', async (req, res) => {
  const { email, displayName } = req.body;

  try {
    let [users] = await pool.promise().query('SELECT * FROM users WHERE Email = ?', [email]);
    
    if (users.length === 0) {
      // User doesn't exist, create a new user
      const role = 'client'; // Default role for new Google users
      const [result] = await pool.promise().query(
        'INSERT INTO users (Email, FName, Role) VALUES (?, ?, ?)',
        [email, displayName, role]
      );
      [users] = await pool.promise().query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
    }

    const user = users[0];
    const { Password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Error during Google sign-in process', error: error.message });
  }
});


   // Store verification codes temporarily (in production, use Redis or database)
const verificationCodes = new Map();

// Generate a random 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request password reset
app.post('/api/users/request-password-reset', async (req, res) => {
    const { email } = req.body;
    
    // Check if user exists
    pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, results) => {
            if (err) {
                console.error('Error in password reset request:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Generate verification code
            const verificationCode = generateVerificationCode();
            
            // Store the code with timestamp (expires in 15 minutes)
            verificationCodes.set(email, {
                code: verificationCode,
                expires: Date.now() + 15 * 60 * 1000 // 15 minutes
            });

            // In production, send email here
            //console.log(`Verification code for ${email}: ${verificationCode}`);

            res.json({ message: 'Verification code sent successfully', code: verificationCode });
        }
    );
});


// Verify reset code
app.post('/api/users/verify-reset-code', (req, res) => {
    const { email, code } = req.body;
    
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
        return res.status(400).json({ message: 'No verification code found' });
    }
    
    if (Date.now() > storedData.expires) {
        verificationCodes.delete(email);
        return res.status(400).json({ message: 'Verification code expired' });
    }
    
    if (storedData.code !== code) {
        return res.status(400).json({ message: 'Invalid verification code' });
    }

    res.json({ message: 'Code verified successfully' });
});

// Reset password
app.post('/api/users/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    
    // Verify code again
    const storedData = verificationCodes.get(email);
    if (!storedData || storedData.code !== code || Date.now() > storedData.expires) {
        return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Hash the new password
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // Update password in database
        pool.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email],
            (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                // Clear verification code
                verificationCodes.delete(email);

                res.json({ message: 'Password reset successfully' });
            }
        );
    });
});


//----------------------------------upload images--------------------------


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 100 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Configure Multer for image storage
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname,'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({ 
  storage: imageStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Middleware to handle JSON data and enable CORS
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', // React frontend server
}));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname,'public' ,'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multi-image upload endpoint
// In server.js
app.post('/api/upload-images', imageUpload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No images uploaded' 
      });
    }

    const files = req.files.map(file => ({
      path: `/uploads/${file.filename}`,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    res.json({ 
      success: true, 
      files: files 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Image upload failed',
      details: error.message 
    });
  }
});


// Add an endpoint to serve images
app.get('/api/images/:id', async (req, res) => {
  try {
    const [rows] = await pool.promise().query('SELECT data, mimeType FROM images WHERE id = ?', [req.params.id]);
    
    if (rows.length > 0) {
      res.setHeader('Content-Type', rows[0].mimeType);
      res.send(rows[0].data);
    } else {
      res.status(404).send('Image not found');
    }
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).send('Error serving image');
  }
});






//---------------------------------------------handle document uploads
// Use memory storage for multer
// Configure multer for file uploads
//const storage = multer.memoryStorage();


// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.static('public'));

// Database paths
const IMAGES_DB_PATH = path.join(__dirname, 'images-db.json');
const DOCUMENTS_DB_PATH = path.join(__dirname, 'documents-db.json');

// Initialize databases
[IMAGES_DB_PATH, DOCUMENTS_DB_PATH].forEach(dbPath => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({}));
  }
});

// Handle document upload
// Handle document upload with image preservation
// In server.js, modify document upload
app.post('/api/upload-document', upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const file = req.file;
    let htmlContent = '';

    if (
      file.mimetype === 'application/msword' || 
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.convertToHtml({ 
        buffer: file.buffer,
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read();
            
            // Generate unique filename
            const filename = `doc-image-${Date.now()}-${Math.random().toString(36).substring(7)}.${image.contentType.split('/')[1]}`;
            const filepath = path.join(__dirname,'public', 'uploads', filename);
            
            // Write image to uploads folder
            fs.writeFileSync(filepath, imageBuffer);
            
            return {
              src: `/uploads/${filename}`,
              alt: 'Document Image'
            };
          } catch (error) {
            console.error('Image processing error:', error);
            return { src: '' };
          }
        })
      });
      
      htmlContent = result.value;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Unsupported file type' 
      });
    }

    res.json({
      success: true,
      content: htmlContent
    });
  } catch (error) {
    console.error('Full document processing error:', error);
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
});

//------------------------------------database.js------------------------------
 

// In your main server file
const databaseRoutes = require('./serverFiles/database.js')(pool);
const certificateRoutes = require('./serverFiles/users.js')(pool);

// Use more specific paths to avoid conflicts
app.use('/api', databaseRoutes);
app.use('/api/certificates', certificateRoutes);


// Add this near the end of your server setup
app.use((req, res, next) => {
  console.log(`Received ${req.method} request to ${req.path}`);
  next();
});

//--------------------------start the server------------------------

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
