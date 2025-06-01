
import { RefreshCw, Trophy, BarChart2, Flame } from 'lucide-react';
import './animations.css'

// Quiz Refresh Loader Component
export const QuizRefreshLoader = ({ isRefreshing, children }) => {
  return (
    <div className="quiz-refresh-container">
      {isRefreshing && (
        <div className="refresh-overlay">
          <RefreshCw 
            className="refresh-icon" 
            size={48} 
            strokeWidth={2} 
            color="#4a90e2"
          />
        </div>
      )}
      {children}
    </div>
  );
};

// Streak Animation Component
export const StreakAnimation = ({ streak }) => {
  return (
    <div className="streak-container">
      <div className="streak-background">
        {[...Array(Math.floor(streak + 1))].map((_, i) => (
          <Flame 
            key={i} 
            className="flame-particle" 
            size={20} 
            color="#ff6b00" 
            style={{
              animationDelay: `${i * 0.2}s`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="streak-content">{streak} days</div>
    </div>
  );
};

// Quiz Score Graph Component
export const QuizScoreGraph = ({ score }) => {
  return (
    <div className="quiz-score-graph">
       <BarChart2
        className="score-bar" 
        size={40} 
        color="#ffd700"
      />
      <div 
        className="score-bar" 
        style={{ 
          width: `${score}%`, 
          backgroundColor: score > 70 ? '#4caf50' : score > 40 ? '#ff9800' : '#f44336'
        }}
      >
        <span className="score-value">{score}%</span>
      </div>
    </div>
  );
};

// Certifications Trophy Component
export const CertificationTrophy = ({ certCount }) => {
  if (certCount === 0) {
    return (
      <div className="empty-trophy-container">
        <div className="empty-trophy-placeholder">
          <p>No Certifications Yet</p>
          <div className="growth-animation"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="trophy-container">
      <Trophy 
        className="trophy-icon" 
        size={40} 
        color="#ffd700"
      />
      <div className="trophy-count">{certCount}</div>
    </div>
  );
};

// Lessons Completed Spinner
export const LessonsCompletedSpinner = ({ completedLessons }) => {
  return (
    <div className="lessons-spinner-container">
      <div className="lessons-spinner">
        <div className="spinner-inner">{completedLessons}</div>
      </div>
      <div className="spinner-overlay"></div>
    </div>
  );
};