// Settings.js
import React, { useState } from 'react';
import { UserCircle, Shield, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../style/Settings.css';
import {DeleteDetails} from '../AnA/Deletepage.js';
import { useTranslation } from 'react-i18next';

function SettingsSection({ current_id, currentUser, onUpdateUser, onDeleteAccount }) {
  const [error, setError] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [profileData, setProfileData] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    email: currentUser.email,
    mobileNumber: currentUser.mobileNumber
  });
  const { t } = useTranslation();

  const handleCredentialVerification = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/verify-credentials', {
        email: credentials.email,
        password: credentials.password
      });
      setIsVerified(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || t('Verification failed'));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/users/update-profile/${current_id}`, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        mobileNumber: profileData.mobileNumber
      });
      
      alert(t('profile updated succesfully!!'))
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
      onUpdateUser(userStorageData);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || t('Update failed'));
    }
  };

  if (!isVerified) {
    return (
      <div className="settings-container">
        <div className="card">
          <div className="card-header">
            <Shield className="icon" />
            <h2>{t('client.Verify Your Identity')}</h2>
            <p>{t('client.verification')}</p>
          </div>
          <div className="card-content">
            <form onSubmit={handleCredentialVerification}>
              {error && <div className="error">{error}</div>}
              <div className="form-group">
                <label htmlFor="email">{t('client.Email')}</label>
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">{t('client.password')}</label>
                <input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  required
                />

                <p> {t('client.forgot password?')} <Link to="/password-recovery">{t('client.Reset your password')}</Link></p>
              </div>
              <button type="submit" className="btn">{t('client.Verify')}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
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
          <DeleteDetails
            user_id={current_id}
            user_email={currentUser.email}
            user_password={currentUser.password}
            onDeleteAccount={onDeleteAccount}
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsSection;
