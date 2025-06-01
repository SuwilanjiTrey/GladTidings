import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import '../style/quiz.css';
import { useTranslation } from 'react-i18next';

function QuizInterface({ quiz, onBack, current_user }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.time ? quiz.time * 60 : null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [passMark, setPassMark] = useState(null);
  const [passed, setPassed] = useState(null);
  const [courseProgress, setCourseProgress] = useState(null);
  const [isLastQuiz, setIsLastQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certificateState, setCertificateState] = useState({
    isGenerating: false,
    isGenerated: false,
    error: null
  });
  const { t } = useTranslation();

  const handleBack = () => {
    onBack();
    window.location.reload();
  };

  // Check if this is the last quiz and get course progress
  useEffect(() => {
    async function checkQuizStatus() {
      try {
        const [progressResponse, quizStatusResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/course-progress', {
            params: {
              userId: JSON.parse(localStorage.getItem('currentUser')).userId,
              courseId: quiz.course_id
            }
          }),
          axios.get('http://localhost:5000/api/quiz-status', {
            params: {
              quizId: quiz.quiz_id,
              courseId: quiz.course_id
            }
          })
        ]);

        setCourseProgress(progressResponse.data);
        setIsLastQuiz(quizStatusResponse.data.isLastQuiz);
        setLoading(false);
      } catch (error) {
        console.error('Error checking quiz status:', error);
        setLoading(false);
      }
    }
    checkQuizStatus();
  }, [quiz.quiz_id, quiz.course_id]);

  // Existing useEffects...
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const response = await axios.get('http://localhost:5000/api/quiz-questions', {
          params: {
            quiz_id: quiz.quiz_id,
            course_id: quiz.course_id,
          },
        });
        setQuestions(response.data);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    }
    fetchQuestions();
  }, [quiz.quiz_id, quiz.course_id]);


//timer

  useEffect(() => {
    if (timeLeft === null) return; // No timer if no time limit set

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);



  useEffect(() => {
    async function fetchPassMark() {
      try {
        const response = await axios.get('http://localhost:5000/api/pass_mark', {
          params: {
            course_id: quiz.course_id,
          },
        });
        setPassMark(response.data.passmark);
      } catch (error) {
        console.error('Error fetching pass mark:', error);
      }
    }
    fetchPassMark();
  }, [quiz.course_id]);


  const handleAnswerChange = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleGenerateCertificate = async () => {
    setCertificateState({
      isGenerating: true,
      isGenerated: false,
      error: null
    });

    try {
      const response = await axios.post('http://localhost:5000/api/certificates/generate-certificate', {
        userId: JSON.parse(localStorage.getItem('currentUser')).userId,
        courseId: quiz.course_id
      });

      setCertificateState({
        isGenerating: false,
        isGenerated: true,
        error: null
      });
    } catch (error) {
      console.error('Error generating certificate:', error);
      setCertificateState({
        isGenerating: false,
        isGenerated: false,
        error: error.response?.data?.error || 'Failed to generate certificate'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('currentUser'));
      
      const response = await axios.post('http://localhost:5000/api/quiz-attempts', {
        user_id: storedUser.userId,
        quiz_id: quiz.quiz_id,
        courseId: quiz.course_id,
        answers: Object.entries(answers).map(([question_id, selected_option_id]) => ({
          question_id: parseInt(question_id),
          selected_option_id,
        })),
      });







      const scorePercentage = (response.data.score / questions.length) * 100;
      setScore(response.data.score);
      setPassed(scorePercentage >= passMark);
      setSubmitted(true);

      if (isLastQuiz) {
        const progressResponse = await axios.get('http://localhost:5000/api/course-progress', {
          params: {
            userId: storedUser.userId,
            courseId: quiz.course_id
          }
        });
        setCourseProgress(progressResponse.data);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (loading) {
    return <div>{t('client.Loading...')}</div>;
  }

  // Disable quiz if it's the last one and not all chapters are completed
  if (isLastQuiz && courseProgress && !courseProgress.allChaptersCompleted) {
    return (
      <div className="quiz-locked">
        <h2>{t('client.Quiz Locked')}</h2>
        <p>{t('client.Please complete')}</p>
        <p>{t('client.Progress')} : {courseProgress.completedModules}/{courseProgress.totalModules} {t('client.chapters completed')}</p>
        <button onClick={handleBack}>{t('client.Back to Course')}</button>
      </div>
    );
  }

  if (submitted) {
    const scorePercentage = (score / questions.length) * 100;
    return (
      <div className="quiz-result">
        <h2>{t('client.Quiz Results')}</h2>
        <p>{t('client.Score')} {score}/{questions.length} ({scorePercentage.toFixed(1)}%)</p>
        <p>{passed ? t('client.You Passed!') : t('client.You Failed! Required') `: ${passMark}%`}</p>
        
        {isLastQuiz && passed && courseProgress?.allChaptersCompleted && (
          <div className="certificate-section">
            {!certificateState.isGenerated && !certificateState.isGenerating && (
              <button 
                onClick={handleGenerateCertificate}
                className="generate-certificate-btn"
                disabled={certificateState.isGenerating}
              >
                {t('client.Generate Certificate')}
              </button>
            )}
            
            {certificateState.isGenerating && (
              <div className="generating-state">
                <Loader2 className="animate-spin h-6 w-6 mr-2" />
                <p>{t('client.Generating your certificate...')}</p>
              </div>
            )}
            
            {certificateState.isGenerated && (
              <div className="success-message">
                <p className="text-green-600">
                  {t('client.Generate success')}
                </p>
              </div>
            )}
            
            {certificateState.error && (
              <div className="error-message">
                <p className="text-red-600">
                  Error: {certificateState.error}
                </p>
                <button 
                  onClick={handleGenerateCertificate}
                  className="retry-btn mt-2"
                >
                  {t('client.Retry Generation')}
                </button>
              </div>
            )}
          </div>
        )}
        
        <button onClick={handleBack} className="mt-4">{t('client.Back to Quizzes')}</button>
      </div>
    );
  }

 return (
    <div className="quiz-interface">
      <button onClick={handleBack}>{t('client.Back to Quizzes')}</button>
      <h2>{quiz.title}</h2>
      
      {/* Only show timer if there's a time limit */}
      {timeLeft !== null && (
        <div className="timer">
          <h3>{t('client.Time Remaining')}: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</h3>
          {timeLeft <= 300 && timeLeft > 0 && ( // Warning when 5 minutes or less remain
            <p className="time-warning">{t('client.Warning: Less than ')}{Math.ceil(timeLeft / 60)} {t('client.minutes remaining!')}</p>
          )}
          {timeLeft <= 0 && (
            <p className="time-expired">{t('client.timeup')}</p>
          )}
        </div>
      )}

      {questions.map((question) => (
        <div key={question.question_id} className="quiz-question">
          <h3>{question.question_text}</h3>
          <div className="quiz-options">
            {question.options.map((option) => (
              <div key={option.option_id} className="quiz-option">
                <label>
                  <input
                    type="radio"
                    name={`question_${question.question_id}`}
                    value={option.option_id}
                    onChange={() => handleAnswerChange(question.question_id, option.option_id)}
                    disabled={timeLeft === 0} // Disable options when time's up
                  />
                  {' '}{option.option_text}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={Object.keys(answers).length < questions.length || timeLeft === 0}
      >
        {t('client.Submit Quiz')}
      </button>
    </div>
  );
}


export default QuizInterface;