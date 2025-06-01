import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Award, 
  ChevronRight
} from 'lucide-react';
import '../style/subscriber.css';
import { useTranslation } from 'react-i18next';

const SubscriberPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [error, setError] = useState('');
  const [church, setChurch] = useState('');
  const { t } = useTranslation();

  // First useEffect to set the church from localStorage
  useEffect(() => {
    const userdata = JSON.parse(localStorage.getItem('currentUser'));
    if (userdata?.church) {
      setChurch(userdata.church);
    } else {
      setError('No church information found');
      setLoading(false);
    }
  }, []);

  // Second useEffect to fetch users when church changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!church) return;
      
      try {
        setLoading(true);
        setError('');
        console.log("Fetching users for church:", church);
        
        const response = await axios.get(`http://localhost:5000/api/users/${church}`);
        
        if (!response.data || !Array.isArray(response.data)) {
          throw new Error('Invalid response format');
        }

        // Fetch course progress for each user
        const usersWithProgress = await Promise.all(
          response.data.map(async (user) => {
            try {
              const progressResponse = await axios.get(
                `http://localhost:5000/api/certificates/course-progress/${user.user_id}`
              );
              return {
                ...user,
                courseProgress: progressResponse.data
              };
            } catch (error) {
              console.error(`Error fetching progress for user ${user.user_id}:`, error);
              return {
                ...user,
                courseProgress: []
              };
            }
          })
        );

        setUsers(usersWithProgress);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [church]);

  // Add debug logging
  useEffect(() => {
    console.log('Debug - Church:', church);
    console.log('Debug - Loading:', loading);
    console.log('Debug - Users:', users);
    console.log('Debug - Error:', error);
  }, [church, loading, users, error]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Award className="mr-3" />
          {t('admin.Loading members...')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="certificate-management-container">
      <nav className="editor-nav">
          <Link to="/Admin-Client" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Client page')}</Link>
          <Link to="/subscribers" className="admin-link"><ChevronRight size={16} /> {t('admin.links.Subscribers')}</Link>
          <Link to="/posts" className="nav-link"> <ChevronRight size={16} /> {t('admin.links.Posts')}</Link>
          <Link to="/courses" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Courses')}</Link>
          <Link to="/quiz-management" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Quizzes')}</Link>
          <Link to="/certificate" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Certifications')} </Link>
          <Link to="/admin-settings" className="nav-link"><ChevronRight size={16} />{t('settings')}</Link>
      </nav>
            
      <div className="page-header">
        <Award size={40} className="mr-4" />
        <h1>{t('admin.members')}</h1>
      </div>

      <div className="users-grid">
        {users.map(user => {
          const courseProgress = user.courseProgress?.find(
            progress => progress.course_id === parseInt(selectedCourse)
          );
          const isEligible = courseProgress?.is_completed;

          return (
            <div 
              key={user.user_id}
              className={`user-card ${selectedUsers.includes(user.user_id) ? 'user-card-selected' : ''}`}
            >
              <div className="user-card-header">
                {/* User header content */}
              </div>

              <div className="user-details">
                <h3>{user.FName} {user.LName}</h3>
                <p>{user.Email}</p>
                <p>{t('admin.Contact')} :{user.contact}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriberPage;