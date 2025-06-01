import React, { useState } from 'react';
import QuizInterface from './QuizInterface';
import { useTranslation } from 'react-i18next';

function QuizSelector({ quizzes, courseId }) {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const { t } = useTranslation();

  // Helper function to format time display
  const formatTimeLimit = (time) => {
    if (!time || time === 0) return 'No time limit';
    return `Time Limit: ${time} minute${time === 1 ? '' : 's'}`;
  };

  if (selectedQuiz) {
    return (
      <QuizInterface
        quiz={selectedQuiz}
        onBack={() => setSelectedQuiz(null)}
      />
    );
  }

  return (
    <div className="quiz-selector">
      <h2>{t('client.Quizzes for this Course')}</h2>
      {quizzes.length === 0 ? (
        <p>{t('client.No_quizzes_available')}</p>
      ) : (
        <div className="quizzes-grid">
          {quizzes.map((quiz) => (
            <div 
              key={quiz.quiz_id} 
              className="quiz-card" 
              onClick={() => setSelectedQuiz(quiz)}
            >
              <h3>{quiz.title}</h3>
              <p>{formatTimeLimit(quiz.time)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuizSelector;