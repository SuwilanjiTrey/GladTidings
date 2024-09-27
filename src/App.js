import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { signInWithGoogle, logOut, auth, handleRedirectResult } from './firebase';
import ClientPage from './ClientPage';
import AdminPage from './AdminPage';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Handle redirect result
    handleRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          console.log("Signed in after redirect:", redirectUser);
          setUser(redirectUser);
        }
      })
      .catch((error) => {
        console.error("Error after redirect:", error);
      });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Router>
      <div className="app-container">
        <header>
          <nav>
            <ul>
              <li><Link to="/client">Client Page</Link></li>
              <li><Link to="/admin">Admin Page</Link></li>
            </ul>
          </nav>
          <div className="auth-container">
            {user ? (
              <>
                <p>Welcome, {user.displayName}</p>
                <button onClick={handleSignOut}>Sign Out</button>
              </>
            ) : (
              <button onClick={handleSignIn}>Sign In with Google</button>
            )}
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/client" element={<ClientPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;