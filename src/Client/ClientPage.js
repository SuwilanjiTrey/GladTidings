import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import {  User, LogOut } from 'lucide-react';
import axios from 'axios';
import '../style/ClientPage.css';
import '../style/mobile.css';
import CourseDetails from './CourseDetails';
import SettingsSection from './settings';
import courseImages from '../images.json';
import QuizInterface from './QuizInterface';
import FlagIcon from '../flagIcon.js';
import QuizzesByCourse from './quizbycourse.js';
import { 
  StreakAnimation, 
  QuizScoreGraph, 
  CertificationTrophy, 
  LessonsCompletedSpinner
} from './animations.js';
import { useTranslation } from 'react-i18next';
//import ClientNotificationViewer from './clientnotify.tsx';

function ClientPage({ signOut }) {
  const [coursesPosts, setCoursesPosts] = useState({});
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [church, setChurch] = useState('');
   const [selectedCourse, setSelectedCourse] = useState(null); // Track the selected course
  const [currentUser, setCurrentUser] = useState(null);
    const [userStats, setUserStats] = useState({
    completedLessons: 0,
    quizScore: 0,
    certifications: 0,
    streak: 0,
  });
  const { t } = useTranslation();
 

  // Fetch all data when the component mounts
useEffect(() => {
  const fetchData = async () => {
    try {
      // Get current user
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      //console.log('time logged in:', storedUser.sessionStartTime);
      console.log('users church: ', storedUser.church);

       
      if (storedUser) {
        setCurrentUser(storedUser);
        setChurch(storedUser.church);
        
        // Fetch courses
        const coursesResponse = await axios.get(`http://localhost:5000/api/courses`, {
          params: { church: storedUser.church }
        });
        console.log("heres the response data:", coursesResponse.data);
            // Get and log all languages
        const languages = coursesResponse.data.map(course => course.language);
        console.log("All course languages:", languages);
        console.log("heres the church data:", church);
        setCourses(coursesResponse.data);


        //more code...
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
          `http://localhost:5000/api/certificates/user/${storedUser?.userId || 1}`
        );
        setCertifications(certificationsResponse.data);
        //console.log(`certifications for user:${storedUser.userId}`, certificationsResponse.data)

        // Fetch user stats
        const userStatsResponse = await axios.get(`http://localhost:5000/api/user-stats/${storedUser.userId}`);
        
        // Update user stats
        setUserStats({
          completedLessons: userStatsResponse.data.totalChaptersCompleted,
          quizScore: userStatsResponse.data.highestQuizScore,
          streak: userStatsResponse.data.loginStreak,
          certifications: certificationsResponse.data.length
        });
        //console.log('new user data:', storedUser);

        // Update login streak
        await axios.post('http://localhost:5000/api/update-login-streak', {
          userId: storedUser.userId
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();
}, []);


const DashboardContent = React.memo(({ courses, userStats, searchQuery, setSearchQuery, onCourseSelect  }) => {
  // Filter courses based on search query
  // Memoize the filtered courses
  const filteredCourses = useMemo(() => 
    courses.filter(course => 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [courses, searchQuery]
  );
  const handleSearchChange = useCallback((value) => {
    debounce((currentValue) => {
      setSearchQuery(currentValue);
    }, 3500)(value);
  }, [setSearchQuery]);

  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t('lessons_completed')}</h3>
          <LessonsCompletedSpinner completedLessons={userStats.completedLessons} />
        </div>
        <div className="stat-card">
          <h3>{t('highest_quiz_score')}</h3>
          <QuizScoreGraph score={userStats.quizScore} />
        </div>
        <div className="stat-card">
          <h3>{t('certifications_count')}</h3>
          <CertificationTrophy certCount={userStats.certifications} />
        </div>
        <div className="stat-card">
          <h3>{t('day_streak')}</h3>
          <StreakAnimation streak={userStats.streak} />
        </div>
      </div>

      <div className="courses-section">
        <div className="courses-header">
          <h2>{t('available_courses')}</h2>
          <div className="search-container">
            <input 
              type="text"
              defaultValue={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('search_courses')}
              className="search-input"
            />
          </div>
        </div>

        <div className="course-grid">
          {filteredCourses.length === 0 ? (
            <div className="no-results">
              {searchQuery ? (
                <p>{t('no_courses_found', { searchQuery })}</p>
              ) : (
                <p>{t('no_courses_available')}</p>
              )}
            </div>
          ) : (
            filteredCourses.map((course) => {
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
                  onClick={() => onCourseSelect(course)}
                >
                  <div className="cours-content-overlay">
                  <h3>
                      {course.title} 
                      {course.language && <FlagIcon language={course.language} size={28} />}
                    </h3>
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
});

//MORE CODE BELOW
  
const handleCourseSelect = useCallback((course) => {
  setSelectedCourse(course);
  setActiveTab('details');
}, []);


   // Render content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
  return (
    <DashboardContent 
    courses={courses}
    userStats={userStats}
    searchQuery={searchQuery}
    setSearchQuery={setSearchQuery}
    onCourseSelect={handleCourseSelect}
  />
  );



      
      case 'details':
        return (
          <div className="course-details-container">
            
            <CourseDetails
              course={selectedCourse}
              posts={coursesPosts[selectedCourse.course_id] || []}
              onBack={() => setActiveTab('dashboard')}
            />
          </div>
        );
      

case 'quizzes':
  return (
    <div className="quizzes-content">
      <h2>{t('bible_quizzes')}</h2>
      <QuizzesByCourse
        quizzes={quizzes}
        courses={courses}
        currentUser={currentUser}
        onQuizSelect={async (quiz) => {
          try {
            const response = await axios.get(
              `http://localhost:5000/api/can-attempt-quiz/${quiz.quiz_id}`,
              { params: { userId: currentUser.userId } }
            );

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
      />
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
    <div>{t('no_quizzes_available')}</div>
  );



      
case 'certifications':
  return (
    <div className="certifications-content">
      <h2>{t('certifications')}</h2>
      {certifications.length === 0 ? (
        <p>{t('noCetifications')}</p>
      ) : (
        <div className="certifications-grid">
          {certifications.map((cert) => (
            <div 
              key={cert.certification_id} 
              className="certification-card"
            >
              <div className="certification-header">
                <h3>{cert.title}</h3>
                <button 
                  className="download-certificate-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening image
                    
                    // Fetch the image and trigger download
                    fetch(`http://localhost:5000/${cert.certificate_url}`)
                      .then(response => response.blob())
                      .then(blob => {
                        // Create a link element
                        console.log("certificate url: http://localhost:5000/", cert.certificate_url);
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `Certificate_${cert.title.replace(/\s+/g, '_')}.jpg`;
                        
                        // Append to body, click, and remove
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // Clean up the created URL
                        URL.revokeObjectURL(link.href);
                      })
                      .catch(error => {
                        console.error('Download failed:', error);
                        alert('Failed to download certificate');
                      });
                  }}
                >
                  {t('download_certificate')}
                </button>
              </div>
              <p>Issued At: {new Date(cert.issued_at || cert.metadata?.awarded_date).toLocaleDateString()}</p>
              <p>Verification Code: {cert.verification_code}</p>
              <div 
                className="certificate-preview"
                onClick={() => window.open(`http://localhost:5000/${cert.certificate_url}`, '_blank')}
              >
                <img 
                  src={`http://localhost:5000/${cert.certificate_url}`} 
                  alt={`Certificate for ${cert.title}`} 
                  className="certificate-thumbnail"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
      case 'settings':
        return currentUser ? (
          <SettingsSection 
            current_id={currentUser.userId}
            currentUser={currentUser}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              // Optionally update localStorage
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }}
            onDeleteAccount={() => {
              // Clear user data and redirect to login
              setCurrentUser(null);
              localStorage.removeItem('currentUser');
              // You might want to add a redirect to login page here
            }}
          />
        ) : (
          <div>{t('login_first')}</div>
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
    {isSidebarOpen ? '✕' : '☰'}
  </button>
  <div className="sidebar-content">
    <div className="user-profile">
 
    <div className="profile-placeholder">
        <User size={40} />
      </div>
      
      <h1>{t('welcome', { name: currentUser?.firstName })}</h1>
    </div>

    <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}   
          >
            {isSidebarOpen && <span>{t('dashboard')}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('quizzes');
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
          >
            {isSidebarOpen && <span>{t('assessments')}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'certifications' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('certifications');
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
          >
            {isSidebarOpen && <span>{t('certifications')}</span>}
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings');
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
          >
            {isSidebarOpen && <span>{t('settings')}</span>}
          </button>
          
          <button
            onClick={() => {
              signOut();
              if (window.innerWidth <= 768) {
                setSidebarOpen(false);
              }
            }}
            className="logOutbtn"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>{t('SignOut')}</span>}
          </button>
        </nav>
  </div>
</div>
      <main className="main-content">{renderContent()}</main>
    </div>
  ); 
}

export default ClientPage;