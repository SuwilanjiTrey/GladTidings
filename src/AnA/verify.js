import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../style/AnA.css';
import SystemNotificationManager from './systemNotice.tsx'
import { useTranslation } from 'react-i18next';

const EmailVerification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mockCode, setMockCode] = useState('');
  const [showNotificationManager, setShowNotificationManager] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData;
  const { t } = useTranslation();


  

useEffect(() => {
  if (!userData) {
    navigate('/signup');
    return;
  }
  
  // Generate mock verification code
  const codevalue = Math.floor(100000 + Math.random() * 900000).toString();
  setMockCode(codevalue);

  console.log('Setting showNotificationManager to true');
  // Set flag to show notification manager
  setShowNotificationManager(true);
}, [userData, navigate]);

const handleVerification = async (e) => {
  e.preventDefault();
  
  if (verificationCode !== mockCode) {
    setError(t('emailVerification.invalidCode'));
    return;
  }

  try {
    // First verify the password
    const credentialsResponse = await axios.post('http://localhost:5000/api/users/verify-credentials', {
      email: userData.email,
      password: password
    });

    if (credentialsResponse.data.user) {
      const email = userData.email;
      const userDataResponse = await axios.get(`http://localhost:5000/api/users/by-email/${email}`);
      
      const latestUserData = userDataResponse.data;
      const userRole = latestUserData.Role || 'client';

      console.log("user role: ", userRole);
      
      // Store minimal but essential user info in localStorage
      const userStorageData = {
        userId: latestUserData.user_id,
        email: latestUserData.Email,
        firstName: latestUserData.FName,
        lastName: latestUserData.LName,
        mobileNumber: latestUserData.contact,
        language: latestUserData.Region,
        church: latestUserData.Church,
        role: userRole
      };

      // Store user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(userStorageData));
      console.log("user data updated: ", userStorageData);
     
      // Fix the role-based navigation logic
      const normalizedRole = userRole.toLowerCase();
      if (normalizedRole === 'admin' || normalizedRole === 'subadmin') {
        console.log("navigating to admin for: ", userRole);
        navigate('/admin');
      } else {
        console.log("navigating to client page for role: ", userRole);
        navigate('/client');
      }
    }
  } catch (error) {
    setError(error.response?.data?.message || t('emailVerification.verificationFailed'));
  }
};

  const message = t('emailVerification.systemMessage', { code: mockCode });

  if (!userData) {
    return null;
  }

  return (
    <div className="signup-form">
      {/* comment for notification manager */}
      {showNotificationManager && userData && (
        <SystemNotificationManager
          email={userData.email}
          systemMessage={message}
        />
      )}
      
      <h2>{t('emailVerification.title')}</h2>
      <p>{t('emailVerification.instructions', { email: userData.email })}</p>
      {/* Remove this in production 
      <p className="mock-notice">(Mock code: {mockCode})</p>*/}
      
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleVerification}>
        <div>
          <input
            type="text"
            placeholder={t('emailVerification.codePlaceholder')}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder={t('emailVerification.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{t('emailVerification.verifyButton')}</button>
      </form>
    </div>
  );
};

export default EmailVerification;