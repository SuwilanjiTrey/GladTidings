import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../style/AnA.css';
import { t } from 'i18next';

const SignUp = ({ setUser, setUserRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [language, setLanguage] = useState('');
  const [church, setChurch] = useState('');
  const [churches, setChurches] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Languages available in your app
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

  ];

  useEffect(() => {
    // Fetch churches when component mounts
    const fetchChurches = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/churches');
        setChurches(response.data);
      } catch (error) {
        console.error('Error fetching churches:', error);
      }
    };
    fetchChurches();
  }, []);

  const handleSignUp = async (e) => { 
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage(t('signUp.passwordMismatchError'));
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/users/signup', {
        email,
        password,
        firstName,
        lastName,
        mobileNumber,
        language,
        church
      });

      if (response.data.user) {
        const userData = {
          userId: response.data.user.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: response.data.user.role || 'client',
          language: language,
          church: church
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);
        setUserRole(userData.role.toLowerCase());
        
        navigate('/verify-email', { state: { userData } });
      } else {
        setMessage(response.data.message || t('signUp.signupError'));
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      setMessage(error.response?.data?.message || t('signUp.signupError'));
    }
    setIsLoading(false);
  };

  return (
    <div className="signup-form">
      <h2>{t('signUp.title')}</h2>
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
        <select
          value={church}
          onChange={(e) => setChurch(e.target.value)}
        >
          <option value="">{t('signUp.selectChurch')}</option>
          {churches.map(church => (
            <option key={church.church_id} value={church.church_name}>
              {church.church_name}
            </option>
          ))}
        </select>
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

      <p className='register' color='white'> Already have an Account? <Link to="/signin">Login</Link></p>
    </div>
  );
};

export default SignUp;