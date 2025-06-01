import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Trash2, ChevronRight, UserCircle } from 'lucide-react';
import { DeleteAdmin } from '../AnA/Deletepage.js';
import '../style/AdminPage.css';
import { useTranslation } from 'react-i18next';

function AdminsSettingsPage({ currentId, currentUser }) {
  const [church, setChurch] = useState('');
  const [language, setLanguage] = useState('');
  const [admin, setAdmin] = useState(null);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState('');
  const { t } = useTranslation();


console.log("admin settings data: current id = ", currentId)
  useEffect(() => {
    const userdata = JSON.parse(localStorage.getItem('currentUser'));
    if (userdata) {
      setChurch(userdata.church || '');
      setLanguage(userdata.language || '');
      setAdmin(userdata.userId || 1);
    }
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/users/update-profile/${admin}`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        mobileNumber: profileData.mobileNumber
      });
      
      alert("profile updated succesfully!!")
      const email = profileData.email;
      const userDataResponse = await axios.get(`http://localhost:5000/api/users/by-email/${email}`);
      const latestUserData = userDataResponse.data;

      const userStorageData = {
        userId: latestUserData.user_id,
        email: latestUserData.Email,
        firstName: latestUserData.FName,
        lastName: latestUserData.LName,
        mobileNumber: latestUserData.contact,
        role: latestUserData.Role || 'client',
        church: latestUserData.Church
      };

      localStorage.setItem('currentUser', JSON.stringify(userStorageData));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  console.log("church name: ", church)


  return (
    <div className="settings-container">
         <nav className="settings-nav">
                  <Link to="/Admin-Client" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Client page')}</Link>
                  <Link to="/subscribers" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Subscribers')}</Link>
                  <Link to="/posts" className="nav-link"> <ChevronRight size={16} /> {t('admin.links.Posts')}</Link>
                  <Link to="/courses" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Courses')}</Link>
                  <Link to="/quiz-management" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Quizzes')}</Link>
                  <Link to="/certificate" className="nav-link"><ChevronRight size={16} /> {t('admin.links.Certifications')} </Link>
                  <Link to="/admin-settings" className="admin-link"><ChevronRight size={16} /> {t('settings')} </Link>
                </nav>


      <div className="tabs">
        <button className="tab active">{t('client.Profile Settings')}<UserCircle className="icon" /></button>
        <button className="tab">{t('client.Danger Zone')} <Trash2 className="icon" /></button>
      </div>
    
      <div className="tab-content">
        <div className="profile-settings">
          <h2>{t('client.Profile Settings')}</h2>
          <p>{t('client.pDetails')}</p>
          <form onSubmit={handleProfileUpdate}>
            {error && <div className="error">{error}</div>}
            <div className="form-group">
              <label htmlFor="firstName">{t('client.First Name')}</label>
              <input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">{t('client.Last Name')}</label>
              <input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('client.Email')}</label>
              <input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="mobile">{t('client.Mobile Number')}</label>
              <input
                id="mobile"
                type="tel"
                value={profileData.mobileNumber}
                onChange={(e) => setProfileData({ ...profileData, mobileNumber: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn">{t('client.Update Profile')}</button>
          </form>
        </div>

        <div className="danger-zone">
          <h2>{t('client.Danger Zone')}</h2>
          <p>{t('client.warning')}</p>
          <DeleteAdmin
            user_id={currentId}
            user_email={currentUser.email}
            churchName = {church}
            user_password={currentUser.password}
          />
        </div>
    </div>
    </div> 
  );
}


export default AdminsSettingsPage;