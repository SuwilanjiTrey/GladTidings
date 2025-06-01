import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronRight, Search } from 'lucide-react';
import '../style/adminquiz.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function AdminQuizManagement() {
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [church, setChurch] = useState('');
  const { t } = useTranslation();

  // Get church from localStorage
  useEffect(() => {
    const userdata = JSON.parse(localStorage.getItem('currentUser'));
    if (userdata) {
      setChurch(userdata.church || '');
    }
  }, []);

  // Fetch quiz attempts when church changes
  const fetchQuizAttempts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/quiz-attempts', {
        params: { church }
      });
      setQuizAttempts(response.data);
      setFilteredAttempts(response.data);
    } catch (error) {
      console.error('Failed to fetch quiz attempts', error);
      alert('Failed to load quiz attempts');
    }
  };

  useEffect(() => {
    if (church) {
      fetchQuizAttempts();
    }
  }, [church]); // Dependency on church

  // Filter attempts based on search term
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = quizAttempts.filter(attempt => {
      const fullName = `${attempt.FName} ${attempt.LName}`.toLowerCase();
      const courseTitle = attempt.course_title.toLowerCase();
      
      return fullName.includes(lowerSearchTerm) || 
             courseTitle.includes(lowerSearchTerm);
    });
    setFilteredAttempts(filtered);
  }, [searchTerm, quizAttempts]);

  const handleResetAttempts = async (userId, quizId) => {
    try {
      const response = await axios.post('http://localhost:5000/api/admin/reset-quiz-attempts', {
        userId,
        quizId
      });

      if (response.data.success) {
        // Refresh the quiz attempts after reset
        fetchQuizAttempts();
        alert('Quiz attempts reset successfully');
      }
    } catch (error) {
      console.error('Failed to reset quiz attempts', error);
      alert('Failed to reset quiz attempts');
    }
  };

  return (
    <div className="admin-quiz-management">
 <nav className="editor-nav">
          <Link to="/Admin-Client" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Client page')}</Link>
          <Link to="/subscribers" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Subscribers')}</Link>
          <Link to="/posts" className="nav-link"> <ChevronRight size={16} /> {t('admin.links.Posts')}</Link>
          <Link to="/courses" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Courses')}</Link>
          <Link to="/quiz-management" className="admin-link"><ChevronRight size={16} /> {t('admin.links.Quizzes')}</Link>
          <Link to="/certificate" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Certifications')} </Link>
          <Link to="/admin-settings" className="nav-link"><ChevronRight size={16} />{t('settings')}</Link>
        </nav>
      
      <div className="search-container p-4">
        <div className="search-bar">
          <Search className="w-5 h-5 text-gray-400 ml-3" />
          <input
            type="text"
            placeholder={t('admin.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-text"
          />
        </div>
      </div>

      <h2>{t('admin.table.Quiz Attempts Management')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('admin.table.User')}</th>
            <th>{t('admin.table.Quiz')}</th>
            <th>{t('admin.table.Course Name')}</th>
            <th>{t('admin.table.Score')}</th>
            <th>{t('admin.table.Passed')}</th>
            <th>{t('admin.table.Attempted At')}</th>
            <th>{t('admin.table.Actions')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredAttempts.map((attempt) => (
            <tr key={attempt.attempt_id}>
              <td>{attempt.FName} {attempt.LName}</td>
              <td>{attempt.quiz_title}</td>
              <td>{attempt.course_title}</td>
              <td>{attempt.score}</td>
              <td>{attempt.passed ? t('admin.table.Yes') : t('admin.table.No')}</td>
              <td>{new Date(attempt.attempted_at).toLocaleString()}</td>
              <td>
                <button 
                  onClick={() => handleResetAttempts(attempt.user_id, attempt.quiz_id)}
                >
                  {t('admin.table.Reset Attempts')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminQuizManagement;