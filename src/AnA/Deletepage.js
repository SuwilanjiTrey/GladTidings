import React, { useState } from 'react';
import axios from 'axios';
import { logOut } from './firebase.js';
import { Trash2, ShieldAlert } from 'lucide-react';
import '../style/delete.css';
import { useTranslation } from 'react-i18next';

function DeleteDetails({ user_id, user_email, onDeleteAccount }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const {t} = useTranslation();
  

  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      const confirmDelete = window.confirm(
        t('confirm delete?')
      );

      if (confirmDelete) {
        // Send the password to the server for validation
        const response = await axios.delete(
          'http://localhost:5000/api/users/delete-account',
          {
            data: {
              userId: user_id,
              email: user_email,
              password: confirmPassword, // Send the entered password
            },
          }
        );

        if (response.status === 200) {
          alert(t('Account deleted successfully, Goodbye!'));
          await logOut();
          onDeleteAccount();
          window.location.replace('/');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || t('Deletion failed. Please try again.'));
    }
  };

  return (
    <div className="delete-details-container">
      {!showConfirm ? (
        <div className="delete-intro">
          <p className="delete-warning">
            <ShieldAlert className="icon-warning" />
            {t('delete warning details')}
          </p>
          <button
            className="delete-button"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="icon-delete" />
            {t('Delete Account')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleDelete} className="delete-form">
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label htmlFor="confirm-password">{t('emailVerification.passwordPlaceholder')}</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('Enter your password to confirm')}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="confirm-button">
              {t('Confirm Delete')}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmPassword('');
                setError(null);
              }}
            >
              {t('admin.course.Cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function DeleteAdmin({ user_id, user_email, churchName}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const {t} = useTranslation();
  

  

  const DeleteAccount= () => {
    // Clear user data and redirect to login
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    // You might want to add a redirect to login page here
  }

  const handleDelete = async (e) => {
    e.preventDefault();

    try {
      const confirmDelete = window.confirm(
        t('confirm delete?')
      );

      if (confirmDelete) {
        
        axios.delete(`http://localhost:5000/api/courses/church/${churchName}`)
        .then(response => {
          console.log(`Deleted ${response.data.deletedCoursesCount} courses`);
        })
        .catch(error => {
          console.error('Error:', error.response.data);
        });


        console.log("admin delete data: ", user_id, user_email, churchName)
        const response = await axios.delete(
          'http://localhost:5000/api/users/delete-church',
          {
            data: {
              userId: user_id,
              email: user_email,
              church: churchName,
              password: confirmPassword, // Send the entered password
            },
          }
        );
        // Example API call
         

        if (response.status === 200) {
          alert(t('Account deleted successfully, Goodbye!'));
          await logOut();
          DeleteAccount();
          window.location.replace('/');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || t('Deletion failed. Please try again.'));
    }
  };

  return (
    <div className="delete-details-container">
      {!showConfirm ? (
        <div className="delete-intro">
          <p className="delete-warning">
            <ShieldAlert className="icon-warning" />
            {t('delete warning details')}
          </p>
          <button
            className="delete-button"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="icon-delete" />
            {t('Delete Account')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleDelete} className="delete-form">
          {error && <p className="error-message">{error}</p>}
          <div className="input-group">
            <label htmlFor="confirm-password">{t('emailVerification.passwordPlaceholder')}</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={t('Enter your password to confirm')}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="confirm-button">
            {t('Confirm Delete')}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmPassword('');
                setError(null);
              }}
            >
              {t('admin.course.Cancel')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export {DeleteDetails, DeleteAdmin};
