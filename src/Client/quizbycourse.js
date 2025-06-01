import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Check, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';


const QuizzesByCourse = ({ quizzes, courses, currentUser, onQuizSelect }) => {
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('available');
  const { t } = useTranslation();

  // Group quizzes by course
  const quizzesByCourse = courses.reduce((acc, course) => {
    acc[course.course_id] = quizzes.filter(quiz => quiz.course_id === course.course_id);
    return acc;
  }, {});

  // Function to format time display
  const formatTimeLimit = (minutes) => {
    if (!minutes) return 'No time limit';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes 
      ? `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const style = {
    container: {
      width: '100%',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    },
    tabContainer: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px'
    },
    tab: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: 'all 0.3s ease'
    },
    activeTab: {
      backgroundColor: '#2563eb',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: '#e5e7eb',
      color: '#374151'
    },
    courseCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '16px',
      overflow: 'hidden'
    },
    courseHeader: {
      padding: '16px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #e5e7eb',
      transition: 'background-color 0.2s ease',
      ':hover': {
        backgroundColor: '#f9fafb'
      }
    },
    courseTitle: {
      margin: 0,
      fontSize: '20px',
      fontWeight: '600'
    },
    quizList: {
      padding: '16px'
    },
    quizItem: {
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginBottom: '12px',
      transition: 'all 0.2s ease'
    },
    quizItemAvailable: {
      cursor: 'pointer',
      ':hover': {
        borderColor: '#2563eb',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }
    },
    quizItemLocked: {
      opacity: 0.75
    },
    quizHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    quizTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: '500'
    },
    quizDescription: {
      margin: '8px 0',
      color: '#6b7280'
    },
    statusMessage: {
      fontSize: '14px',
      marginTop: '8px'
    },
    errorMessage: {
      color: '#ef4444'
    },
    successMessage: {
      color: '#22c55e'
    },
    timeLimit: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '8px'
    },
    quizMetadata: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginTop: '8px',
      color: '#6b7280',
      fontSize: '14px'
    }
  };

  return (
    <div style={style.container}>
      <div style={style.tabContainer}>
        <button
          style={{
            ...style.tab,
            ...(activeTab === 'available' ? style.activeTab : style.inactiveTab)
          }}
          onClick={() => setActiveTab('available')}
        >
          {t('client.Available_Quizzes')}
        </button>
        <button
          style={{
            ...style.tab,
            ...(activeTab === 'completed' ? style.activeTab : style.inactiveTab)
          }}
          onClick={() => setActiveTab('completed')}
        >
          {t('client.Completed_Quizzes')}
        </button>
      </div>

      <div>
        {courses.map((course) => {
          const courseQuizzes = quizzesByCourse[course.course_id] || [];
          const filteredQuizzes = courseQuizzes.filter(quiz => 
            activeTab === 'available' ? !quiz.passed : quiz.passed
          );

          if (filteredQuizzes.length === 0) return null;

          return (
            <div key={course.course_id} style={style.courseCard}>
              <div
                style={style.courseHeader}
                onClick={() => setExpandedCourse(
                  expandedCourse === course.course_id ? null : course.course_id
                )}
              >
                <h2 style={style.courseTitle}>{course.title}</h2>
                {expandedCourse === course.course_id ? (
                  <ChevronUp size={24} />
                ) : (
                  <ChevronDown size={24} />
                )}
              </div>

              {expandedCourse === course.course_id && (
                <div style={style.quizList}>
                  {filteredQuizzes.map((quiz) => (
                    <div
                      key={quiz.quiz_id}
                      style={{
                        ...style.quizItem,
                        ...(quiz.can_attempt ? style.quizItemAvailable : style.quizItemLocked)
                      }}
                      onClick={() => quiz.can_attempt && onQuizSelect(quiz)}
                    >
                      <div style={style.quizHeader}>
                        <h3 style={style.quizTitle}>{quiz.title}</h3>
                        {quiz.passed ? (
                          <Check size={20} color="#22c55e" />
                        ) : !quiz.can_attempt ? (
                          <Lock size={20} color="#6b7280" />
                        ) : null}
                      </div>
                      <p style={style.quizDescription}>{quiz.description}</p>
                      
                      <div style={style.quizMetadata}>
                        <div style={style.timeLimit}>
                          <Clock size={16} />
                          {formatTimeLimit(quiz.time)}
                        </div>
                        {!quiz.can_attempt && !quiz.passed && (
                          <p style={{...style.statusMessage, ...style.errorMessage}}>
                            {t('client.Maximum_attempts_reached')}
                          </p>
                        )}
                        {quiz.passed && (
                          <p style={{...style.statusMessage, ...style.successMessage}}>
                            {t('client.Quiz_completed')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizzesByCourse;