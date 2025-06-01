const express = require('express');
const router = express.Router();


// Assuming you'll pass the database connection from server.js
module.exports = (pool) => {
  // Course-related endpoints
  
  // Create a new course
  router.post('/courses', async (req, res) => {
    try {
      const { title, description, created_by, imgId, church, language } = req.body;
      
      console.log("course data recieved: ", [title, description, created_by, imgId, church, language]);
      const [result] = await pool.promise().query(
        'INSERT INTO courses (title, description, created_by, imageId, church, language) VALUES (?, ?, ?, ?, ?, ?)',
        [title, description, created_by, imgId, church, language]
      );
  
      res.status(201).json({
        success: true,
        course_id: result.insertId,
        message: 'Course created successfully'
      });
    } catch (error) {
      console.error('Course creation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create course',
        details: error.message 
      });
    }
  });

  // Get all courses
  router.get('/courses', (req, res) => {
    const { church } = req.query; // Get church from query parameter
    
    const sqlQuery = `
      SELECT *
      FROM courses
      WHERE church = ?
      ORDER BY created_at DESC
    `;
    
    pool.query(sqlQuery, [church], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch courses' });
      }
      res.json(results);
    });
  });
  




  router.delete('/courses/:id', async (req, res) => {
    const { id } = req.params;
    const { church } = req.query; // Add church parameter
    let connection;
  
    try {
      connection = await pool.promise().getConnection();
      await connection.beginTransaction();
  
      // First verify the course belongs to the church
      const [courseCheck] = await connection.query(
        'SELECT church FROM courses WHERE course_id = ?',
        [id]
      );
  
      if (courseCheck.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Course not found' 
        });
      }
  
      if (courseCheck[0].church !== church) {
        return res.status(403).json({ 
          success: false, 
          error: 'Unauthorized to delete this course' 
        });
      }

    // Delete foreign key constraints
    await connection.query('Delete from certifications where course_id = ?', [id]);

    await connection.query('Delete from chapter_completion where course_id = ?', [id]);

    await connection.query('Delete from course_progress where course_id = ?', [id]);

    // Delete quiz attempts first to remove foreign key constraints
    await connection.query('DELETE qa FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.quiz_id WHERE q.course_id = ?', [id]);

    // Delete quiz question options
    await connection.query('DELETE qqo FROM quiz_question_options qqo JOIN quiz_questions qq ON qqo.question_id = qq.question_id JOIN quizzes q ON qq.quiz_id = q.quiz_id WHERE q.course_id = ?', [id]);

    // Delete quiz questions
    await connection.query('DELETE qq FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.quiz_id WHERE q.course_id = ?', [id]);

    // Delete quizzes
    await connection.query('DELETE FROM quizzes WHERE course_id = ?', [id]);

    // Then delete the course
    const [result] = await connection.query('DELETE FROM courses WHERE course_id = ?', [id]);

    // Commit the transaction
    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    res.json({ success: true, message: 'Course and all associated data deleted successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete course', 
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


router.delete('/courses/church/:churchName', async (req, res) => {
  const { churchName } = req.params;
  let connection;

  try {
    connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    // First verify if the church has any courses
    const [courseCheck] = await connection.query(
      'SELECT course_id FROM courses WHERE church = ?',
      [churchName]
    );

    if (courseCheck.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No courses found for this church' 
      });
    }

    // Get all course IDs for this church
    const courseIds = courseCheck.map(course => course.course_id);

    // Delete all related data for all courses
    const deleteQueries = [
      // Delete certifications
      'DELETE FROM certifications WHERE course_id IN (?)',
      
      // Delete chapter completions
      'DELETE FROM chapter_completion WHERE course_id IN (?)',
      
      // Delete course progress
      'DELETE FROM course_progress WHERE course_id IN (?)',
      
      // Delete quiz attempts
      'DELETE qa FROM quiz_attempts qa JOIN quizzes q ON qa.quiz_id = q.quiz_id WHERE q.course_id IN (?)',
      
      // Delete quiz question options
      'DELETE qqo FROM quiz_question_options qqo JOIN quiz_questions qq ON qqo.question_id = qq.question_id JOIN quizzes q ON qq.quiz_id = q.quiz_id WHERE q.course_id IN (?)',
      
      // Delete quiz questions
      'DELETE qq FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.quiz_id WHERE q.course_id IN (?)',
      
      // Delete quizzes
      'DELETE FROM quizzes WHERE course_id IN (?)',
      
      // Finally, delete the courses
      'DELETE FROM courses WHERE church = ?'
    ];

    // Execute all delete queries
    for (const query of deleteQueries) {
      if (query.includes('IN (?)')) {
        await connection.query(query, [courseIds]);
      } else {
        await connection.query(query, [churchName]);
      }
    }

    // Commit the transaction
    await connection.commit();

    res.json({ 
      success: true, 
      message: `All courses and associated data for church "${churchName}" deleted successfully`,
      deletedCoursesCount: courseCheck.length
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error deleting church courses:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete church courses', 
      details: error.message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


  // Quiz-related endpoints
  
  // Create a new quiz
  router.post('/quizzes', async (req, res) => {
    let connection;
    try {
      const { course_id, title, description, created_by, questions, time } = req.body;
      
      connection = await pool.promise().getConnection();
      await connection.beginTransaction();
  
      // Insert quiz with time field
      const [quizResult] = await connection.query(
        'INSERT INTO quizzes (course_id, title, description, time, created_by) VALUES (?, ?, ?, ?, ?)',
        [course_id, title, description, time || null, created_by]
      );
      const quiz_id = quizResult.insertId;
  
      // Rest of your existing question and option insertion code remains the same
      for (const question of questions) {
        const [questionResult] = await connection.query(
          'INSERT INTO quiz_questions (quiz_id, question_text, question_type) VALUES (?, ?, ?)',
          [quiz_id, question.question_text, question.question_type]
        );
  
        if (question.options && question.options.length > 0) {
          const optionValues = question.options.map(opt => [
            questionResult.insertId,
            opt.option_text,
            opt.is_correct || false
          ]);
  
          await connection.query(
            'INSERT INTO quiz_question_options (question_id, option_text, is_correct) VALUES ?',
            [optionValues]
          );
        }
      }
  
      await connection.commit();
  
      res.status(201).json({
        success: true,
        quiz_id: quiz_id,
        message: 'Quiz created successfully'
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Quiz creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create quiz',
        details: error.message
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });


  router.get('/getChurchId/:id', async (req, res) => {
    try {
      const { id } = req.params; // Correctly get the param from req.params
      console.log("data received:", id);
  
      const [results] = await pool.promise().query(
        'SELECT church_id FROM churches JOIN users ON users.user_id = churches.elder_id WHERE users.user_id = ?',
        [id]
      );
  
      if (results.length > 0) {
        const churchId = results[0].church_id; // Extract the church_id
        console.log("church id = ", churchId);
        res.json({ church_id: churchId }); // Send the church_id as an object
      } else {
        res.status(404).json({ error: 'No church found for the given user ID' });
      }
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to fetch church ID' });
    }
  });
  
  

  // Get all quizzes
  router.get('/allquizzes', async (req, res) => {
    const { church_Id } = req.query;
    
    console.log("received church id:", church_Id);
    
    if (!church_Id || church_Id === '') {
      return res.status(400).json({
        success: false,
        error: 'church_id is required',
      });
    }
  
    try {
      const [quizzes] = await pool.promise().query(
        `
        SELECT 
    q.quiz_id,
    q.title AS quiz_title,
    q.description AS quiz_description,
    q.time,
    q.created_at AS quiz_created_at,
    c.title AS course_title,
    c.church AS church_name
FROM quizzes q
JOIN courses c ON q.course_id = c.course_id
JOIN churches ch ON c.church = ch.church_name
WHERE ch.church_id = ?
ORDER BY q.created_at DESC;

        `,
        [church_Id]
      );
  
      res.json(quizzes);
    } catch (error) {
      console.error('Fetching quizzes error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quizzes',
        details: error.message,
      });
    }
  });
  

   // Get all client quizzes
router.get('/all-client-quizzes', async (req, res) => {
  try {
    const userId = req.query.userId || req.user.userId;

    const [quizzes] = await pool.promise().query(`
      SELECT 
        q.quiz_id, 
        q.course_id, 
        q.title, 
        q.description, 
        q.time,
        (
          SELECT COUNT(*) 
          FROM quiz_attempts qa 
          WHERE qa.user_id = ? AND qa.quiz_id = q.quiz_id
        ) AS total_attempts,
        (
          SELECT MAX(passed) 
          FROM quiz_attempts qa 
          WHERE qa.user_id = ? AND qa.quiz_id = q.quiz_id
        ) AS passed
      FROM 
        quizzes q
      ORDER BY 
        q.created_at DESC
    `, [userId, userId]);

    // Process quizzes to determine if they can be attempted
    const processedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      can_attempt: quiz.passed !== 1 && quiz.total_attempts < 3,
      attempted: quiz.total_attempts > 0
    }));

    res.json(processedQuizzes);
  } catch (error) {
    console.error('Fetching quizzes error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch quizzes',
      details: error.message 
    });
  }
});

router.get('/can-attempt-quiz/:quizId', async (req, res) => {
  try {
    const userId = req.query.userId || req.user.userId;
    const quizId = req.params.quizId;

    // Fetch the latest attempts for this user and quiz
    const [attempts] = await pool.promise().query(`
      SELECT 
        attempt_id, 
        passed, 
        attempted_at,
        (
          SELECT COUNT(*) 
          FROM quiz_attempts 
          WHERE user_id = ? AND quiz_id = ?
        ) AS total_attempts
      FROM quiz_attempts 
      WHERE user_id = ? AND quiz_id = ?
      ORDER BY attempted_at DESC
    `, [userId, quizId, userId, quizId]);

    // Check if quiz has been passed
    const passedAttempts = attempts.filter(attempt => attempt.passed === 1);
    if (passedAttempts.length > 0) {
      return res.json({ 
        canAttempt: false, 
        message: 'You have already passed this quiz.' 
      });
    }

    // If no attempts or attempts have been reset
    if (attempts.length === 0 || attempts[0].total_attempts < 3) {
      return res.json({ 
        canAttempt: true,
        remainingAttempts: 3 - attempts[0]?.total_attempts || 3
      });
    }

    // If 3 attempts have been made
    return res.json({ 
      canAttempt: false, 
      message: 'You have exhausted all attempts for this quiz.' 
    });
    
    
  } catch (error) {
    console.error('Checking quiz attempt error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check quiz attempt',
      details: error.message 
    });
  }
  console.log(res.json)
});

  // Route to reset quiz attempts for a specific user and quiz
router.post('/admin/reset-quiz-attempts', async (req, res) => {

  try {
    const { userId, quizId } = req.body;
    
    // Validate admin permissions (you'll need to implement this middleware)
    // Example: checkAdminPermissions middleware
    console.log(`request to reset quiz attempt for user: ${userId} and quiz: ${quizId}`);
    // Delete existing attempts for this user and quiz
    await pool.promise().query(`
      DELETE FROM quiz_attempts 
      WHERE user_id = ? AND quiz_id = ?
    `, [userId, quizId]);

    res.json({ 
      success: true, 
      message: 'Quiz attempts reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting quiz attempts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset quiz attempts',
      details: error.message 
    });
  }
});

// Route to get all users' quiz attempts (for admin view)
router.get('/admin/quiz-attempts', async (req, res) => {
  try {
    const { church } = req.query;
    const [results] = await pool.promise().query(
      `SELECT qa.*, u.FName, u.LName, q.title as quiz_title, c.title as course_title 
       FROM quiz_attempts qa 
       JOIN users u ON qa.user_id = u.user_id 
       JOIN quizzes q ON qa.quiz_id = q.quiz_id 
       JOIN courses c ON q.course_id = c.course_id 
       WHERE u.church = ?
       ORDER BY qa.attempted_at DESC`,
      [church]
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempts' });
  }
});

router.get('/quizzes', async (req, res) => {
  const { course_id } = req.query; // Extract course_id from query parameters

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required' });
  }

  try {
    // Fetch quizzes linked to the specific course_id
    const [quizzes] = await pool.promise().query(
      'SELECT * FROM quizzes WHERE course_id = ?',
      [course_id]
    );

    res.json(quizzes); // Send filtered quizzes
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});



router.get('/quiz-questions', async (req, res) => {
  const { quiz_id, course_id } = req.query; // Extract quiz_id and course_id

  if (!quiz_id || !course_id) {
    return res.status(400).json({ error: 'quiz_id and course_id are required' });
  }

  try {
    const [questions] = await pool.promise().query(
      `SELECT 
        qq.question_id, qq.quiz_id, qq.question_text, qq.question_type,
        qqo.option_id, qqo.option_text, qqo.is_correct
       FROM quiz_questions qq
       JOIN quiz_question_options qqo ON qq.question_id = qqo.question_id
       JOIN quizzes q ON qq.quiz_id = q.quiz_id
       WHERE q.quiz_id = ? AND q.course_id = ?`,
      [quiz_id, course_id]
    );

    console.log('quiz_id:', quiz_id);
    console.log('course_id:', course_id);


    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found for this quiz and course' });
    }

    // Group options under their respective questions
    const groupedQuestions = questions.reduce((acc, row) => {
      const { question_id, quiz_id, question_text, question_type, option_id, option_text, is_correct } = row;

      if (!acc[question_id]) {
        acc[question_id] = {
          question_id,
          quiz_id,
          question_text,
          question_type,
          options: [],
        };
      }

      acc[question_id].options.push({ option_id, option_text, is_correct });
      return acc;
    }, {});

    res.json(Object.values(groupedQuestions)); // Send grouped questions as an array
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});



router.post('/quiz-attempts', async (req, res) => {
  const { user_id, quiz_id, courseId, answers } = req.body;
  
  // Input validation
  if (!user_id || !quiz_id || !courseId || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  let connection;
  try {
    // Get connection from pool
    connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    // Calculate score using a single query for better performance
    const scoreQuery = `
      SELECT COUNT(*) as correct_count 
      FROM quiz_question_options 
      WHERE option_id IN (?) AND is_correct = true
    `;
    const [scoreResult] = await connection.query(scoreQuery, [answers.map(a => a.selected_option_id)]);
    const score = scoreResult[0].correct_count;

    // Validate quiz exists and get course info in a single query
    const [quizAndCourse] = await connection.query(`
      SELECT c.pass_criteria, q.quiz_id, 
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = ?) as total_questions
      FROM quizzes q 
      JOIN courses c ON c.course_id = q.course_id 
      WHERE q.quiz_id = ? AND c.course_id = ?
    `, [quiz_id, quiz_id, courseId]);

    if (!quizAndCourse[0]) {
      await connection.rollback();
      return res.status(404).json({ error: 'Quiz or course not found' });
    }

    const { pass_criteria, total_questions } = quizAndCourse[0];
    const scorePercentage = (score / total_questions) * 100;
    const passed = scorePercentage >= pass_criteria;

    // Record the attempt
    await connection.query(`
      INSERT INTO quiz_attempts 
        (user_id, quiz_id, score, passed, pass_criteria_at_attempt)
      VALUES (?, ?, ?, ?, ?)
    `, [user_id, quiz_id, score, passed, pass_criteria]);

    await connection.commit();
    
    return res.json({
      success: true,
      score,
      scorePercentage,
      totalQuestions: total_questions,
      passed,
      passCriteria: pass_criteria
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    console.error('Error submitting quiz attempt:', error);
    return res.status(500).json({ error: 'Failed to submit quiz attempt' });

  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

// Delete a quiz
router.delete('/quizzes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // First, delete any related questions and their options
    await pool.promise().query('DELETE qqo FROM quiz_question_options qqo JOIN quiz_questions qq ON qqo.question_id = qq.question_id WHERE qq.quiz_id = ?', [id]);
    await pool.promise().query('DELETE FROM quiz_questions WHERE quiz_id = ?', [id]);

    // Then delete the quiz
    const [result] = await pool.promise().query('DELETE FROM quizzes WHERE quiz_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, error: 'Failed to delete quiz', details: error.message });
  }
});


  
  
  
  // Track course progress
// Get course progress and chapter completion status
router.get('/course-progress', async (req, res) => {
  try {
    const { userId, courseId } = req.query;
    
    const connection = await pool.promise().getConnection();
    
    try {
      // Get total chapters and completed chapters
      const [progress] = await connection.query(
        `SELECT completed_modules, total_modules 
         FROM course_progress 
         WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
      );
      
      // Check if all chapters are completed
      const allChaptersCompleted = progress.length > 0 && 
        progress[0].completed_modules === progress[0].total_modules;
      
      res.json({
        completedModules: progress[0]?.completed_modules || 0,
        totalModules: progress[0]?.total_modules || 0,
        allChaptersCompleted
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error getting course progress:', error);
    res.status(500).json({ error: 'Failed to get course progress' });
  }
});

// Check if quiz is the last one in the course
router.get('/quiz-status', async (req, res) => {
  try {
    const { quizId, courseId } = req.query;
    
    const [quizzes] = await pool.promise().query(
      `SELECT quiz_id FROM quizzes 
       WHERE course_id = ? 
       ORDER BY quiz_id DESC 
       LIMIT 1`,
      [courseId]
    );
    
    res.json({
      isLastQuiz: quizzes.length > 0 && quizzes[0].quiz_id === parseInt(quizId)
    });
  } catch (error) {
    console.error('Error checking quiz status:', error);
    res.status(500).json({ error: 'Failed to check quiz status' });
  }
});

  // Get user's certifications
  router.get('/certifications/:user_id', async (req, res) => {
    try {
      const [certifications] = await pool.promise().query(`
        SELECT c.*, co.title as course_title 
        FROM certifications c
        JOIN courses co ON c.course_id = co.course_id
        WHERE c.user_id = ?
        ORDER BY c.issued_at DESC
      `, [req.params.user_id]);

      res.json(certifications);
    } catch (error) {
      console.error('Fetching certifications error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch certifications',
        details: error.message 
      });
    }
  });


  // In your API routes file
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get highest quiz score and the corresponding quiz
    const [highestScoreResult] = await pool.promise().query(
      'SELECT MAX(score) as highest_score, quiz_id FROM quiz_attempts WHERE user_id = ? ORDER BY score DESC LIMIT 1',
      [userId]
    );

    // If there's a highest score, get total questions for that specific quiz
    let totalQuizQuestions = 0;
    if (highestScoreResult[0]?.quiz_id) {
      const [totalQuestionsResult] = await pool.promise().query(
        'SELECT COUNT(*) as total_questions FROM quiz_questions WHERE quiz_id = ?',
        [highestScoreResult[0].quiz_id]
      );
      totalQuizQuestions = totalQuestionsResult[0].total_questions;
    }

    const [chaptersCompletedResult] = await pool.promise().query(
      'SELECT SUM(completed_modules) as total_chapters FROM course_progress WHERE user_id = ?',
      [userId]
    );

    const [loginStreakResult] = await pool.promise().query(
      `SELECT COALESCE(current_streak, 1) as login_streak 
       FROM user_login_history 
       WHERE user_id = ? 
       ORDER BY login_date DESC 
       LIMIT 1`,
      [userId]
    );

    res.json({
      // Calculate percentage score if both highest score and total questions are available
      highestQuizScore: totalQuizQuestions 
        ? Math.round((highestScoreResult[0].highest_score / totalQuizQuestions) * 100) 
        : 0,
      totalChaptersCompleted: chaptersCompletedResult[0].total_chapters || 0,
      loginStreak: loginStreakResult[0]?.login_streak || 1
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

 // Route to update login streak
router.post('/update-login-streak', async (req, res) => {
  const { userId } = req.body;
  try {
    // First, check if user has already logged in today
    const [existingLogin] = await pool.promise().query(`
      SELECT * FROM user_login_history 
      WHERE user_id = ? AND login_date = CURRENT_DATE
    `, [userId]);

    // If already logged in today, return early
    if (existingLogin.length > 0) {
      return res.status(200).json({ 
        message: 'Already logged in today', 
        alreadyLoggedIn: true,
        currentStreak: existingLogin[0].current_streak
      });
    }

    // Get the last login to calculate streak
    const [lastLoginRows] = await pool.promise().query(`
      SELECT 
        COALESCE(MAX(login_date), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY)) AS last_login_date,
        COALESCE(MAX(current_streak), 0) AS last_streak
      FROM user_login_history 
      WHERE user_id = ?
    `, [userId]);

    const { last_login_date, last_streak } = lastLoginRows[0];
    
    // Determine the new streak
    const newStreak = (last_login_date && 
      (await pool.promise().query('SELECT DATEDIFF(CURRENT_DATE, ?) AS diff', [last_login_date]))[0][0].diff === 1)
      ? last_streak + 1
      : 1;

    // Insert the new login record
    await pool.promise().query(`
      INSERT INTO user_login_history 
      (user_id, login_date, current_streak) 
      VALUES (?, CURRENT_DATE, ?)
    `, [userId, newStreak]);

    res.status(200).json({ 
      message: 'Login streak updated', 
      alreadyLoggedIn: false,
      currentStreak: newStreak
    });
  } catch (error) {
    console.error('Error updating login streak:', error);
    res.status(500).json({ error: 'Failed to update login streak' });
  }
});


router.post('/update-progress', async (req, res) => {
  let connection;
  try {
    const { userId, courseId, postId, completed } = req.body;
    
    if (!completed) {
      return res.json({ success: true }); // If not completed, do nothing
    }

    connection = await pool.promise().getConnection();
    // Begin transaction
    await connection.beginTransaction();

    try {
      // Insert chapter completion record (if it doesn't exist)
      await connection.query(
        `INSERT IGNORE INTO chapter_completion (user_id, course_id, post_id)
         VALUES (?, ?, ?)`,
        [userId, courseId, postId]
      );

      // Get total number of posts for this course
      const [totalPosts] = await connection.query(
        'SELECT COUNT(*) as total FROM posts WHERE course_id = ?',
        [courseId]
      );

      // Get number of completed posts for this user and course
      const [completedPosts] = await connection.query(
        'SELECT COUNT(*) as completed FROM chapter_completion WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );

      // Update course_progress
      await connection.query(
        `INSERT INTO course_progress 
         (user_id, course_id, completed_modules, total_modules, is_completed) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         completed_modules = ?,
         total_modules = ?,
         is_completed = ?,
         last_accessed = CURRENT_TIMESTAMP`,
        [
          userId,
          courseId,
          completedPosts[0].completed,
          totalPosts[0].total,
          completedPosts[0].completed === totalPosts[0].total,
          completedPosts[0].completed,
          totalPosts[0].total,
          completedPosts[0].completed === totalPosts[0].total
        ]
      );

      await connection.commit();
      res.json({ 
        success: true,
        completedModules: completedPosts[0].completed,
        totalModules: totalPosts[0].total
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

router.get('/user-progress', async (req, res) => {
  let connection;
  try {
    const { userId, courseId } = req.query;
    
    connection = await pool.promise().getConnection();
    
    const [completedChapters] = await connection.query(
      `SELECT post_id, completed_at 
       FROM chapter_completion 
       WHERE user_id = ? AND course_id = ?
       ORDER BY completed_at`,
      [userId, courseId]
    );

    res.json({ 
      completedChapters,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

  //endpoint to track specific chapters completed
  router.get('/chapter-status', async (req, res) => {
  try {
    const { userId, postId } = req.query;
    
    const [completion] = await pool.promise().query(
      'SELECT completed_at FROM chapter_completion WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    res.json({ 
      completed: completion.length > 0,
      completedAt: completion[0]?.completed_at
    });
  } catch (error) {
    console.error('Error checking chapter status:', error);
    res.status(500).json({ error: 'Failed to check chapter status' });
  }
});
// Endpoint to update course pass criteria
router.post('/courses/:courseId/pass-criteria', async (req, res) => {
  let connection;
  try {
    const { courseId } = req.params;
    const { passCriteria } = req.body;

    // Validate pass criteria
    if (passCriteria < 0 || passCriteria > 100) {
      return res.status(400).json({ 
        error: 'Pass criteria must be between 0 and 100' 
      });
    }

    connection = await pool.promise().getConnection();
    
    // Update pass criteria
    await connection.query(
      `UPDATE courses 
       SET pass_criteria = ?, 
           pass_criteria_update = CURRENT_TIMESTAMP
       WHERE course_id = ?`,
      [passCriteria, courseId]
    );

    res.json({ 
      success: true, 
      message: 'Pass criteria updated successfully' 
    });

  } catch (error) {
    console.error('Error updating pass criteria:', error);
    res.status(500).json({ error: 'Failed to update pass criteria' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/pass_mark', async (req, res) => {
  let connection;
  try {
    // Change from req.params to req.query since you're sending it as a query parameter
    const { course_id } = req.query;
    
    // Validate course_id
    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    connection = await pool.promise().getConnection();
    
    const [results] = await connection.query(
      'SELECT pass_criteria FROM courses WHERE course_id = ?',
      [course_id]
    );

    if (!results.length) {
      return res.status(404).json({ error: 'criteria not yet set' });
    }

    // Return the pass_criteria directly since that's what you're using in the frontend
    res.json({
      passmark: results[0].pass_criteria
    });

  } catch (error) {
    console.error('Error fetching quiz pass mark:', error);
    res.status(500).json({ error: 'Error fetching quiz pass mark' });
  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});


// Endpoint to get quiz results with historical context
router.get('/quiz-results/:quizId/user/:userId', async (req, res) => {
  let connection;
  try {
    const { quizId, userId } = req.params;
    
    connection = await pool.promise().getConnection();
    
    const [results] = await connection.query(
      `SELECT 
        qa.*, 
        q.course_id,
        c.pass_criteria as current_pass_criteria
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.quiz_id
       JOIN courses c ON q.course_id = c.course_id
       WHERE qa.quiz_id = ? AND qa.user_id = ?
       ORDER BY qa.attempted_at DESC
       LIMIT 1`,
      [quizId, userId]
    );

    if (!results.length) {
      return res.status(404).json({ error: 'No attempts found' });
    }

    // Return both historical and current context
    res.json({
      attempt: results[0],
      historicallyPassed: results[0].passed === 1,
      wouldPassNow: (results[0].score * 100) >= results[0].current_pass_criteria
    });

  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  } finally {
    if (connection) connection.release();
  }
});

  
  return router;
};