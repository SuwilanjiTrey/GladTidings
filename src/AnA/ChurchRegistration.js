import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';

const ChurchElderSignUp = ({ setUser, setUserRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
    const [language, setLanguage] = useState('');
  const [churchName, setChurchName] = useState('');
  const [churchAddress, setChurchAddress] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const languages = [
    { code: 'en', name: 'English' },
    {code: 'es', name: 'Español'},
    {code: 'fr', name: 'Français'},
    {code: 'de', name: 'Deutsch'},
    {code: 'it', name: 'Italiano'},
    {code: 'pt', name: 'Português'},
    {code: 'ar', name: 'العربية'},
    {code: 'ja', name: '日本語'},
    {code: 'ko', name: '한국어'},
    {code: 'zh-CN', name: '中文'}
  ];


  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t('signUp.passwordMismatchError'));
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/users/elder-signup', {
        email,
        password,
        firstName,
        lastName,
        language,
        mobileNumber,
        churchName,
        churchAddress
      });

      if (response.data.user) {
        const userData = {
          userId: response.data.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          language: language,
          role: 'subAdmin',
          churchId: response.data.church.id
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);
        setUserRole('subAdmin');
        
        navigate('/verify-email', { state: { userData } });
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      setMessage(error.response?.data?.message || t('signUp.signupError'));
    }
    setIsLoading(false);
  };

  return (
    <div className="signup-form">
      <h2>{t('signUp.elderTitle')}</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="email"
          placeholder={t('signUp.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t('signUp.firstNamePlaceholder')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t('signUp.lastNamePlaceholder')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder={t('signUp.mobileNumberPlaceholder')}
          value={mobileNumber}
          onChange={(e) => setMobileNumber(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder={t('signUp.churchNamePlaceholder')}
          value={churchName}
          onChange={(e) => setChurchName(e.target.value)}
          required
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
        >
          <option value="">{t('signUp.selectLanguage')}</option>
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={t('signUp.churchAddressPlaceholder')}
          value={churchAddress}
          onChange={(e) => setChurchAddress(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('signUp.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={t('signUp.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? t('signUp.signUpLoading') : t('signUp.signUpButton')}
        </button>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default ChurchElderSignUp;