import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { logOut} from './AnA/firebase';
import SignIn from './AnA/signin';
import SignUp from './AnA/signup';
import EmailVerification from './AnA/verify';
import ClientPage from './Client/ClientPage';
import ImageEditor from './Admin/cerificateGenerator';
import AdminPage from './Admin/AdminPage';
import AdminsSettingsPage from './Admin/AdminSettings';
import AdminClientPage from './Admin/Admin-Client';
import SubscriberPage from './Admin/subscriber';
import AdminCoursesPage from './Admin/AdminCourse';
import AdminQuizManagement from './Admin/Adminquiz';
import Home from './Home'; 
import { PasswordRecovery } from './AnA/recoverpassword';
import SystemAward from './Client/certificateAward';
import ChurchElderSignUp from './AnA/ChurchRegistration';
import './style/App.css';
import LanguageSwitcher from './Language/GoogleTranslate';
import './Language/config';
import { useTranslation } from 'react-i18next';
import Contact from "./Contact.jsx";
import About from "./About.jsx";



// Helper function to check if user has admin privileges
const hasAdminPrivileges = (role) => {
  const normalizedRole = (role || '').toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'subadmin';
};



function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const SESSION_TIMEOUT = 60 * 60 * 1000;
  const sessionTimerRef = useRef(null);

  const { t } = useTranslation();

  // Session Management Functions remain the same
  const checkSessionValidity = useCallback(() => {
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    if (!sessionStartTime) return false;
    
    const currentTime = new Date().getTime();
    return (currentTime - parseInt(sessionStartTime)) <= SESSION_TIMEOUT;
  }, [SESSION_TIMEOUT]);

  const updateSessionTimestamp = useCallback(() => {
    localStorage.setItem('sessionStartTime', new Date().getTime().toString());
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionStartTime');
      
      await logOut();
      
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    sessionTimerRef.current = setTimeout(handleSignOut, SESSION_TIMEOUT);
  }, [SESSION_TIMEOUT, handleSignOut]);

  // Initial user restoration and session check
  useEffect(() => {
    const initializeSession = () => {
      const storedUserData = localStorage.getItem('currentUser');
      console.log("App.js - Stored user data:", storedUserData);
      if (!storedUserData) {
        setLoading(false);
        return;
      }

      if (!checkSessionValidity()) {
        handleSignOut();
        setLoading(false);
        return;
      }

      try {
        const parsedUserData = JSON.parse(storedUserData);
        setUser(parsedUserData);
        setUserRole(parsedUserData.role?.toLowerCase());
        updateSessionTimestamp();
        resetSessionTimer();
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        localStorage.removeItem('currentUser');
        handleSignOut();
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, [checkSessionValidity, updateSessionTimestamp, resetSessionTimer, handleSignOut]);

  // Activity monitoring effect remains the same
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      updateSessionTimestamp();
      resetSessionTimer();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    resetSessionTimer();

    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, updateSessionTimestamp, resetSessionTimer]);

  // Periodic session check remains the same
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(() => {
      if (!checkSessionValidity()) {
        handleSignOut();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [user, checkSessionValidity, handleSignOut]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <header className={`header ${user ? 'hidden' : ''}`}>
          <div className="header-content">
            <nav className='nav-igation'>
              <ul className="nav-list">
                <li><Link to="/" className="nav-link">{t('home')}</Link></li>
                <li><Link to="/about" className="nav-link">{t('aboutUs')}</Link></li>
                <li><Link to="/contact" className="nav-link">{t('contactUs')}</Link></li>
                {!user && (
                  <>
                    <li><Link to="/signin" className="nav-link">{t('signIn.title')}</Link></li>
                    <li><Link to="/signup" className="nav-link">{t('signUp.title')}</Link></li>
                  </>
                )}
              </ul>
              <LanguageSwitcher />
            </nav>
            <div className="auth-container">
              {user && (
                <>
                  <span>{t('Welcome')} {user.email || user.firstName}</span>
                  <button onClick={handleSignOut} className="button button-primary">Sign Out</button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            {/* Home route with role-based redirection */}
            <Route 
              path="/" 
              element={
                userRole ? (
                  <Navigate 
                    to={
                      hasAdminPrivileges(userRole)
                        ? '/admin' 
                        : '/client'
                    } 
                  />
                ) : (
                  <Home />
                )
              } 
            />

            {/* Protected Client route */}
            <Route 
              path="/client" 
              element={
                user ? (
                  <ClientPage signOut={handleSignOut} />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />

            {/* Protected Admin routes - now accessible by both admin and subAdmin */}
            <Route 
                path="/admin" 
                element={
                  (() => {
                    console.log("Admin route check - User:", user);
                    console.log("Admin route check - UserRole:", userRole);
                    console.log("Admin route check - Has privileges:", hasAdminPrivileges(userRole));
                    return user && hasAdminPrivileges(userRole)
                      ? <AdminPage /> 
                      : <Navigate to="/" />;
                  })()
                } 
              />
            <Route 
              path="/admin-client" 
              element={
                user && hasAdminPrivileges(userRole)
                  ? <AdminClientPage /> 
                  : <Navigate to="/signin" />
              } 
            />
            <Route 
              path="/subscribers" 
              element={
                user && hasAdminPrivileges(userRole)
                  ? <SubscriberPage /> 
                  : <Navigate to="/signin" />
              } 
            />
            <Route 
              path="/certificate" 
              element={
                user && hasAdminPrivileges(userRole)
                  ? <ImageEditor /> 
                  : <Navigate to="/signin" />
              } 
            />
            <Route 
              path="/courses" 
              element={
                user && hasAdminPrivileges(userRole)
                  ? <AdminCoursesPage /> 
                  : <Navigate to="/signin" />
              } 
            />
            <Route 
              path="/quiz-management" 
              element={
                user && hasAdminPrivileges(userRole)
                  ? <AdminQuizManagement /> 
                  : <Navigate to="/signin" />
              } 
            />

            <Route 
              path="/admin-settings" 
              element={user && hasAdminPrivileges(userRole)
                
                ?<AdminsSettingsPage currentId={user.userId} currentUser={user}/> 
                : 
                <Navigate to="/signin" /> 
              } 
            />

            {/* Authentication routes */}
            <Route 
              path="/signin" 
              element={
                user ? (
                  <Navigate 
                    to={
                      hasAdminPrivileges(userRole)
                        ? '/admin' 
                        : '/client'
                    } 
                  />
                ) : (
                  <SignIn setUser={setUser} setUserRole={setUserRole} />
                )
              } 
            />
            <Route 
              path="/signup" 
              element={
                user ? (
                  <Navigate 
                    to={
                      hasAdminPrivileges(userRole)
                        ? '/admin' 
                        : '/client'
                    } 
                  />
                ) : (
                  <SignUp setUser={setUser} setUserRole={setUserRole} />
                )
              } 
            />

            {/* Other static routes */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/password-recovery" element={<PasswordRecovery />} />
            <Route path="/auto-award" element={<SystemAward />} />
            <Route path="/church" element={<ChurchElderSignUp setUser={setUser} setUserRole={setUserRole}/>} />

            
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;