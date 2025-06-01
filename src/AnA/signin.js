import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { signInWithGoogle, auth } from './firebase';

import '../style/AnA.css';

const SignIn = ({ setUser, setUserRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

const initializeSession = (userData) => {
  // Store user data
  localStorage.setItem('currentUser', JSON.stringify(userData));
  // Initialize session timestamp
  localStorage.setItem('sessionStartTime', new Date().getTime().toString());
  
  setUser(userData);
  setUserRole(userData.role.toLowerCase());
};

const handleSignIn = async (e) => {
  e.preventDefault();
  setMessage('');
  
  try {
    const response = await axios.post('http://localhost:5000/api/users/signin', {
      email,
      password,
    }); 

    if (response.data && response.data.user) {
      const userDataResponse = await axios.get(`http://localhost:5000/api/users/by-email/${email}`);
      
      const latestUserData = userDataResponse.data;
      const userRole = latestUserData.Role || 'client';

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


      
      initializeSession(userStorageData);  // This will handle localStorage and state setting


        // Redirect based on normalized role
        if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'subadmin') {
          navigate('/admin');
        }  else {
          navigate('/client');
        }
      } else {
        setMessage(response.data.message || t('messages.invalidResponse'));
      }
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || t('messages.errorSigningIn'));
      } else if (error.request) {
        setMessage(t('messages.noServerResponse'));
      } else {
        setMessage(t('messages.requestSetupError'));
      }
    }
  };



const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithGoogle();
    const googleUser = result.user;
    
    try {
      const userDataResponse = await axios.get(`http://localhost:5000/api/users/by-email/${googleUser.email}`);
      
      if (userDataResponse.data) {
        const latestUserData = userDataResponse.data;
        const userRole = latestUserData.Role || 'client';

        const userStorageData = {
          userId: latestUserData.user_id,
          email: latestUserData.Email,
          firstName: latestUserData.FName,
          lastName: latestUserData.LName,
          mobileNumber: latestUserData.contact,
          languge: latestUserData.Region,
          role: userRole
        };

        initializeSession(userStorageData);  // This will handle localStorage and state setting

          // Redirect based on role
          if (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'subadmin') {
            navigate('/admin');
          }
          else {
            navigate('/client');
          }
        } else {
          // User doesn't exist in database, show error message
          setMessage(t('messages.accountNotFound'));
          // Optional: Sign out from Firebase to clean up the authentication state
          await auth.signOut();
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setMessage(t('messages.accountNotFound'));
        } else {
          setMessage(t('messages.checkingAccountError'));
        }
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

return (
    <div className="signin-form">
      <h2>{t('signIn.title')}</h2>
      {message && <p className="error">{message}</p>}
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          placeholder={t('signIn.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('signIn.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">
        {t('signIn.signInWithEmail')}
        </button>
      </form>
      <button onClick={handleGoogleSignIn}>
        <svg className="google" xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 488 512">
          <path fill="#ea4335" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
        </svg>
        {t('signIn.signInWithGoogle')}
    </button>
    <p> {t('signIn.forgotPassword')} <Link to="/password-recovery">Reset your password</Link></p>
    <p className='register' color='white'> Dont have an Account? <Link to="/signup">Register Here</Link></p>
    
    </div>
  );
};

export default SignIn;