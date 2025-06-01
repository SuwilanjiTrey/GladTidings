import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../style/ClientPage.css';
import CourseDetails from '../Client/CourseDetails';
import courseImages from '../images.json';
import QuizInterface from '../Client/QuizInterface';
import { 
  StreakAnimation, 
  QuizScoreGraph, 
  CertificationTrophy, 
  LessonsCompletedSpinner
} from '../Client/animations.js';
//import ClientNotificationViewer from './clientnotify.tsx';

function ClientPage() {
  const [coursesPosts, setCoursesPosts] = useState({});
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeQuizTab, setActiveQuizTab] = useState('available');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  
   const [selectedCourse, setSelectedCourse] = useState(null); // Track the selected course
  const [currentUser, setCurrentUser] = useState(null);
    const [userStats, setUserStats] = useState({
    completedLessons: 0,
    quizScore: 0,
    certifications: 0,
    streak: 0,
  });
 

  // Fetch all data when the component mounts
useEffect(() => {
  const fetchData = async () => {
    try {
      // Get current user
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      console.log('time logged in:', storedUser.sessionStartTime);
      //console.log('user ID: ', storedUser.userId);
       
      if (storedUser) {
        setCurrentUser(storedUser);
        
        // Fetch courses
        const coursesResponse = await axios.get('http://localhost:5000/api/courses');
        setCourses(coursesResponse.data);

        // Fetch posts for each course
        const coursePostsMap = {};
        for (const course of coursesResponse.data) {
          const postsResponse = await axios.get(`http://localhost:5000/api/posts/${course.course_id}`);
          coursePostsMap[course.course_id] = postsResponse.data;
        }
        setCoursesPosts(coursePostsMap);
        
        // Fetch quizzes
        const quizzesResponse = await axios.get('http://localhost:5000/api/all-client-quizzes', {
          params: { userId: storedUser.userId }
        });
        setQuizzes(quizzesResponse.data);

        
        // Fetch certifications
        const certificationsResponse = await axios.get(
          `http://localhost:5000/api/certificates/user/${1}`
        );
        setCertifications(certificationsResponse.data);
        //console.log(`certifications for user:${storedUser.userId}`, certificationsResponse.data)

        // Fetch user stats
        
        
        // Update user stats
        setUserStats({
          completedLessons: 1,
          quizScore: 100,
          streak: 2,
          certifications: 3
        });
        //console.log('new user data:', storedUser);

        
       
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();
}, []);

  

   // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="stats-grid">
  <div className="stat-card">
    <h3>Lessons Completed</h3>
    <LessonsCompletedSpinner completedLessons={userStats.completedLessons} />
  </div>
  <div className="stat-card">
    <h3>Highest Quiz Score</h3>
    <QuizScoreGraph score={userStats.quizScore} />
  </div>
  <div className="stat-card">
    <h3>Certifications</h3>
    <CertificationTrophy certCount={userStats.certifications} />
  </div>
  <div className="stat-card">
    <h3>Day Streak</h3>
    <StreakAnimation streak={userStats.streak} />
  </div>
</div>
            <div className="courses-section">
              <h2>Available Courses</h2>
              <div className="courses-grid">
                {courses.length === 0 ? (
                  <p>No courses available</p>
                ) : (
                   courses.map((course) => {
              const imageNumber = course.imageId ? `img${course.imageId}` : null;
              const courseImage = imageNumber ? courseImages.images.find(img => img.id === imageNumber) : null;
              
                    return (
                      <div
                        key={course.course_id}
                        className="course-card"
                        style={{
                         
                          backgroundImage: courseImage ? `url(${courseImage.path})` : 'none',
                          backgroundColor: !courseImage ? '#f0f0f0' : 'transparent',
                 
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative'
                        }}
                        onClick={() => {
                          setSelectedCourse(course);
                          setActiveTab('details');
                        }}
                      >
                        <div className="course-content-overlay">
                          <h3>{course.title}</h3>
                          <p>{course.description.substring(0, 100)}...</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );


      
      case 'details':
        return (
          <div className="course-details-container">
            <button 
              onClick={() => setActiveTab('dashboard')} 
            >
              Back to Courses
            </button>
            <CourseDetails
              course={selectedCourse}
              posts={coursesPosts[selectedCourse.course_id] || []}
            />
          </div>
        );
      

case 'quizzes':
  return (
    <div className="quizzes-content">
      <h2>Bible Quizzes</h2>
      <div className="quiz-tabs">
        <button 
          className={activeQuizTab === 'available' ? 'active' : ''}
          onClick={() => setActiveQuizTab('available')}
        >
          Available Quizzes
        </button>
        <button 
          className={activeQuizTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveQuizTab('completed')}
        >
          Completed Quizzes
        </button>
      </div>

      {activeQuizTab === 'available' ? (
        <div className="quizzes-grid">
          {quizzes
            .filter(quiz => !quiz.passed) // Only show non-passed quizzes
            .map((quiz) => (
              <div 
                key={quiz.quiz_id} 
                className={`quiz-card ${quiz.canAttempt ? 'available' : 'locked'}`}
                onClick={async () => {
                  if (!quiz.can_attempt) {
                    //console.log("quiz status: ", quiz);
                    //console.log("can attempt:", quiz.can_attempt);
                    alert('You cannot attempt this quiz. You may have exhausted your attempts or already passed it.');

                    return;
                  }
                  
                  try {
                    const response = await axios.get(`http://localhost:5000/api/can-attempt-quiz/${quiz.quiz_id}`, {
                      params: { userId: currentUser.userId }
                    });

                    if (response.data.canAttempt) {
                      setSelectedQuiz(quiz);
                      setActiveTab('take-quiz');
                    } else {
                      alert(response.data.message || 'You cannot attempt this quiz.');
                    }
                  } catch (error) {
                    console.error('Error checking quiz attempt:', error);
                    alert('Failed to check quiz attempt. Please try again.');
                  }
                }}
              >
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
                  {!quiz.can_attempt && <span className="badge locked">Locked</span>}
                </div>
                <p>{quiz.description}</p>
                {!quiz.can_attempt && (
                  <div className="attempts-info">
                    Maximum attempts reached contact admin to retake this quiz
                  </div>
                )}
              </div>
            ))
          }
        </div>
      ) : (
        <div className="quizzes-grid">
          {quizzes
            .filter(quiz => quiz.passed)
            .map((quiz) => (
              <div 
                key={quiz.quiz_id} 
                className="quiz-card completed"
              >
                <div className="quiz-card-header">
                  <h3>{quiz.title}</h3>
                  <span className="badge passed">Completed</span>
                </div>
                <p>{quiz.description}</p>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );

// Add a new case for taking a quiz
case 'take-quiz':
  return selectedQuiz ? (
    <QuizInterface 
      quiz={selectedQuiz} 
      onBack={() => setActiveTab('dashboard')} 
      current_user={currentUser} 
    />
  ) : (
    <div>No quiz selected</div>
  );



      
case 'certifications':
  return (
    <div className="certifications-content">
      <h2>Your Certifications</h2>
      
         
    </div>
  );
      case 'settings':
        return (
          <Link to="/Admin" className="admin-link">Go to main admin Page</Link>
        );
          
        

      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <button
          className="toggle-button"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen} {/* Sidebar toggle */}
        </button>
        <div className="sidebar-content">
          <div className="user-profile">
           
          <header>
            <h1>Welcome, {currentUser ? currentUser.firstName : 'User'}!</h1>
          </header>
          </div>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              {isSidebarOpen && <span>Dashboard</span>}
            </button>
            
            <button
              className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setActiveTab('quizzes')}
            >
              {isSidebarOpen && <span>Assessments</span>}
            </button>
            
            <button
              className={`nav-item ${activeTab === 'certifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('certifications')}
            >
              {isSidebarOpen && <span>Certifications</span>}
            </button>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              {/*<Settings size={20} />*/}
              {isSidebarOpen && <span>Back to main page</span>}
            </button>
          </nav>
        </div>
      </div>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

export default ClientPage;