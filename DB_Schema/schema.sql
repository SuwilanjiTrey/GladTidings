-- Create the GladTidings database
CREATE DATABASE IF NOT EXISTS GladTidings;
USE GladTidings;

-- Churches table
CREATE TABLE churches (
    church_id INT AUTO_INCREMENT PRIMARY KEY,
    church_name VARCHAR(255) NOT NULL,
    address TEXT,
    contact VARCHAR(20),
    elder_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password VARCHAR(255),
    FName VARCHAR(100),
    LName VARCHAR(100),
    Contact VARCHAR(20),
    Role ENUM('admin', 'subAdmin', 'client') DEFAULT 'client',
    Region VARCHAR(100),
    Church VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table (updated with missing columns)
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    church VARCHAR(255),
    language VARCHAR(50),
    created_by INT,
    imageId INT NULL,
    pass_criteria DECIMAL(5,2) DEFAULT 50.00,
    pass_criteria_update TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Posts table (chapters/lessons)
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT,
    language VARCHAR(50),
    church VARCHAR(255),
    course_id INT,
    created_by INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Quizzes table (missing from original schema)
CREATE TABLE quizzes (
    quiz_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time INT NULL COMMENT 'Time limit in minutes',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Quiz questions table (missing from original schema)
CREATE TABLE quiz_questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'essay') DEFAULT 'multiple_choice',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE
);

-- Quiz question options table (missing from original schema)
CREATE TABLE quiz_question_options (
    option_id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(question_id) ON DELETE CASCADE
);

-- Chapter completion tracking (updated with missing columns)
CREATE TABLE chapter_completion (
    completion_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    post_id INT,
    course_id INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_post (user_id, post_id)
);

-- Course progress tracking (updated with missing columns)
CREATE TABLE course_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    completed_modules INT DEFAULT 0,
    total_modules INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course (user_id, course_id)
);

-- Quiz attempts table (updated with missing columns)
CREATE TABLE quiz_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT NULL,
    quiz_id INT,
    post_id INT NULL,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) NULL,
    pass_criteria_at_attempt DECIMAL(5,2) NULL COMMENT 'Pass criteria when attempt was made',
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    passed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Certifications table
CREATE TABLE certifications (
    cert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    certificate_url VARCHAR(500),
    issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_data LONGTEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_course_cert (user_id, course_id)
);

-- User login history (updated with missing columns)
CREATE TABLE user_login_history (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_date DATE DEFAULT (CURRENT_DATE),
    current_streak INT DEFAULT 1,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Images table (for storing uploaded images)
CREATE TABLE images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255),
    data LONGBLOB,
    mimeType VARCHAR(100),
    size INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE churches 
ADD FOREIGN KEY (elder_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_posts_course_id ON posts(course_id);
CREATE INDEX idx_posts_church ON posts(church);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_users_email ON users(Email);
CREATE INDEX idx_users_church ON users(Church);
CREATE INDEX idx_users_role ON users(Role);
CREATE INDEX idx_chapter_completion_user ON chapter_completion(user_id);
CREATE INDEX idx_chapter_completion_course ON chapter_completion(course_id);
CREATE INDEX idx_course_progress_user ON course_progress(user_id);
CREATE INDEX idx_courses_church ON courses(church);

-- Additional indexes for quiz-related tables
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_question_options_question_id ON quiz_question_options(question_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_course_id ON quiz_attempts(course_id);
CREATE INDEX idx_user_login_history_user_id ON user_login_history(user_id);
CREATE INDEX idx_user_login_history_date ON user_login_history(login_date);

-- Insert default admin user (optional)
INSERT INTO users (Email, Password, FName, LName, Role, Region, Church) 
VALUES ('admin@gladtidings.com', '$2b$10$defaulthashedpassword', 'System', 'Administrator', 'admin', 'Global', 'Main');

-- Sample data (optional)
INSERT INTO churches (church_name, address, contact) 
VALUES ('Main Church', '123 Main Street', '+1234567890');

INSERT INTO courses (title, description, church, language, created_by) 
VALUES ('Introduction to Faith', 'Basic course for new believers', 'Main Church', 'English', 1);
