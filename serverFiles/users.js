const { createCanvas, loadImage } = require('canvas');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');




module.exports = (pool) => {
  // Storage configuration for certificate templates
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname,'..' ,'public', 'certificates', 'templates');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

//certification templates
router.post('/update-certificate-template', upload.single('template'), async (req, res) => {
  //console.log("request to create templates recieved");
  try {
    const { courseId } = req.body;
    const {metadata} = req.body;
    const templatePath = req.file.path;
    const relativePath = path.relative(path.join(__dirname, '..', 'public'), templatePath);

    console.log("metadata: ", metadata);
    console.log("saved certificate to :", relativePath);

    // Update course with template URL
    await pool.promise().query(
      'UPDATE courses SET certificateUrl = ?, certificate_metadata = ?  WHERE course_id = ?',
      [relativePath, metadata, courseId]
    );

    res.json({
      success: true,
      templateUrl: relativePath
    });
  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});



router.get('/list', async (req, res) => {
  const {id} = req.query;
  console.log("recieved id:", [id]);
  try {
    const [certificates] = await pool.promise().query(
      `SELECT course_id, title, certificateUrl
       FROM courses where created_by = ?`, [id]
    );
    if (certificates){
      res.json(certificates);
    } else {
      console.log("something went wrong");
    }
    
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});



router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Delete certificate record from the database
    const [result] = await pool.promise().query(
      `Update courses SET certificateUrl = null WHERE course_id = ?;
       Update courses SET certificate_metadata = null WHERE course_id = ?;`,
      [id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or already deleted',
      });
    }

    res.json({
      success: true,
      message: 'Certificate deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});



  // Get user certificates
  router.get('/user/:userId', async (req, res) => {
    try {
      const [certificates] = await pool.promise().query(
        `SELECT c.*, co.title 
         FROM certifications c
         JOIN courses co ON c.course_id = co.course_id
         WHERE c.user_id = ? AND c.status = 'active'`,
        [req.params.userId]
      );
      
      res.json(certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Verify certificate
  router.get('/verify/:code', async (req, res) => {
    try {
      const [certificate] = await pool.promise().query(
        `SELECT c.*, u.FName, u.LName, co.title
         FROM certifications c
         JOIN users u ON c.user_id = u.user_id
         JOIN courses co ON c.course_id = co.course_id
         WHERE c.verification_code = ?`,
        [req.params.code]
      );
      
      if (certificate.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Certificate not found'
        });
      }

      res.json({
        success: true,
        certificate: certificate[0]
      });
    } catch (error) {
      console.error('Certificate verification error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });



router.get('/course-progress/:userId', async (req, res) => {
  try {
    const [progress] = await pool.promise().query(
      `SELECT cp.*, c.title 
       FROM course_progress cp
       JOIN courses c ON cp.course_id = c.course_id
       WHERE cp.user_id = ?`,
      [req.params.userId]
    );
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course progress'
    });
  }
});


// Certificate generation endpoint
router.post('/generate-certificate', async (req, res) => {
  try {
    const { courseId, userId } = req.body;
    
    // Get course details - now only need certificateUrl and basic metadata
    const [courseDetails] = await pool.promise().query(
      'SELECT certificateUrl, certificate_metadata FROM courses WHERE course_id = ?',
      [courseId]
    );

    if (!courseDetails.length || !courseDetails[0].certificateUrl) {
      throw new Error('Certificate template not found');
    }

    // Get user details
    const [userDetails] = await pool.promise().query(
      'SELECT FName, LName FROM users WHERE user_id = ?',
      [userId]
    );

    if (!userDetails.length) {
      throw new Error('User not found');
    }

    // Load the template image
    const templatePath = path.join(__dirname, '..', 'public', courseDetails[0].certificateUrl);
    const image = await loadImage(templatePath);

    // Create canvas with template dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw template image
    ctx.drawImage(image, 0, 0);

    // Parse metadata - only for color and position
    const metadata = JSON.parse(courseDetails[0].certificate_metadata || '{}');
    
    try {
      // Use system font - Georgia is an elegant serif font available on most systems
      ctx.font = '72px Georgia';  // Fixed size for consistency
      ctx.fillStyle = metadata.color || '#000000';
      ctx.textAlign = 'center';
      
      // Log the font being used
      console.log('Using font:', ctx.font);
      
      // Add user's name
      const fullName = `${userDetails[0].FName} ${userDetails[0].LName}`;
      ctx.fillText(
        fullName,
        metadata.position?.x || canvas.width / 2,
        metadata.position?.y || canvas.height / 2
      );

    } catch (error) {
      console.error('Text rendering error:', error);
      // Fallback to Arial if Georgia fails
      ctx.font = '72px Arial';
      ctx.fillStyle = metadata.color || '#000000';
      ctx.textAlign = 'center';
      
      const fullName = `${userDetails[0].FName} ${userDetails[0].LName}`;
      ctx.fillText(
        fullName,
        metadata.position?.x || canvas.width / 2,
        metadata.position?.y || canvas.height / 2
      );
    }

    // Save the generated certificate
    const fileName = `certificate-${userId}-${courseId}-${Date.now()}.png`;
    const savePath = path.join('public', 'certificates', 'generated', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save the image
    const buffer = canvas.toBuffer('image/png');
    await fs.promises.writeFile(savePath, buffer);

    // Save certificate record in database
    const certificateUrl = path.join('certificates', 'generated', fileName);
    await pool.promise().query(
      'INSERT INTO certifications (user_id, course_id, certificate_url, status, verification_code) VALUES (?, ?, ?, ?, ?)',
      [userId, courseId, certificateUrl, 'active', crypto.randomBytes(16).toString('hex')]
    );

    res.json({ 
      success: true,
      certificateUrl: certificateUrl
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate certificate' 
    });
  }
});


router.post('/generate-simple/:id', async (req, res) => {
  const { courseId, userId } = req.body;
  
  console.log("data : ", [courseId, userId]);

});

// Get completed users endpoint
// Add this logging to see exactly what's happening
router.get('/:courseId/completed-users', async (req, res) => {
  console.log("Getting completed users for course:", req.params.courseId);
  
  try {
    const { courseId } = req.params;
    
    // Log the query for debugging
    //console.log("Executing query with courseId:", courseId);
    
    // If using mysql2/promise
    const [users] = await pool.promise().query(`
      SELECT u.user_id, u.FName, u.LName 
      FROM users u
      JOIN course_progress cp ON u.user_id = cp.user_id
      WHERE cp.course_id = ? AND cp.is_completed = 1
    `, [courseId]);
    
    // Log the results
   // console.log("Query results:", users);

    // Check if users is undefined or null
    if (!users) {
      throw new Error('No results returned from database');
    }

    // Send the response
    res.json(users);
    
  } catch (error) {
    // Log the full error
    console.error('Error fetching completed users:', error);
    
    res.status(500).json({ 
      error: 'Failed to fetch completed users',
      details: error.message,
      // Only include stack trace in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

 
  return router;
};