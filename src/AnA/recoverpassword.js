import React, { useState } from 'react';
import { Mail, ShieldCheck, Key, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';
import SystemNotificationManager from './systemNotice.tsx';
import '../style/password.css';

function PasswordRecovery() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shouldSendEmail, setShouldSendEmail] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');



  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/users/request-password-reset', { email });
      if (response.data.code) {
        const message = `Your verification code is: ${response.data.code}`;
        setSystemMessage(message);
        setShouldSendEmail(true); // Trigger email send only after successful API response
      }
      setStep('verify');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    }
  };



  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/verify-reset-code', {
        email,
        code: verificationCode
      });
      setStep('reset');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/users/reset-password', {
        email,
        code: verificationCode,
        newPassword
      });
      setSuccess(true);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');

    }
  };
  if (success) {
    return (
      <div className="flex-center bg-gray-50">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Success!</h2>
            <p className="card-description">
              Your password has been reset successfully. You can now login with your new password.
            </p>
          </div>
          <div className="card-content">
            <button
              className="btn-primary w-full"
              onClick={() => (window.location.href = '/signin')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center bg-gray-50">
      {shouldSendEmail && (
        <SystemNotificationManager
          email={email}
          systemMessage={systemMessage}
        />
      )}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Reset Password</h2>
          <p className="card-description">
            {step === 'email' && (
              <>
                <Mail className="icon" /> Enter your email to receive a verification code
              </>
            )}
            {step === 'verify' && (
              <>
                <ShieldCheck className="icon" /> Enter the verification code sent to your email
              </>
            )}
            {step === 'reset' && (
              <>
                <Key className="icon" /> Create a new password
              </>
            )}
          </p>
        </div>
        <div className="card-content">
          {error && <p className="alert alert-danger">{error}</p>}

          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Code
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerificationSubmit} className="form">
              <div className="form-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Verify Code
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordReset} className="form">
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform text-gray-500"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">
                Reset Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export { PasswordRecovery };