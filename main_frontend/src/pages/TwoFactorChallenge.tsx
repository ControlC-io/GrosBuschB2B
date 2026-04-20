import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth';
import {
  getPending2FAEmail,
  setPendingEmailOtpUserId,
  clearPending2FAEmail,
} from '../authStorage';

const TwoFactorChallenge = () => {
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const { verify2FALogin, checkSession } = useAuth();
  const navigate = useNavigate();

  // Note: During 2FA challenge, user may not be fully authenticated yet
  // Better Auth maintains a temporary session for 2FA verification
  // So we don't redirect if user is null - the backend will handle the session

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // verify2FALogin sets user state via flushSync — navigate is safe immediately after.
      await verify2FALogin(code, trustDevice);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleUseEmailCode = async () => {
    const email = getPending2FAEmail();
    if (!email) {
      setError('Email not found. Please go back and sign in again.');
      return;
    }
    setError('');
    setEmailOtpSending(true);
    try {
      const res = await fetch('/api/auth/request-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      let data: { error?: string; userId?: string } = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      if (!res.ok) {
        setError(data?.error || 'Could not send email code. Use authenticator or backup code.');
        return;
      }
      if (data?.userId) {
        setPendingEmailOtpUserId(data.userId);
        clearPending2FAEmail();
        navigate('/auth/email-otp');
      }
    } catch {
      setError('Could not send email code. Try again or use authenticator.');
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyBackupCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/two-factor/verify-backup-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          code: backupCode,
          trustDevice 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid backup code');
      }

      // checkSession(true) uses flushSync so user state is committed before navigate().
      await checkSession(true);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid backup code');
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl p-8 border border-border dark:border dark:border-border-dark">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 text-primary-on-light dark:text-primary-on-dark dark:bg-icon-dark dark:border dark:border-border-dark">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark mb-2">Two-Factor Authentication</h1>
            <p className="text-textSecondary dark:text-textSecondary-dark">
              {showBackupCode 
                ? 'Enter one of your backup codes'
                : 'Enter the 6-digit code from your authenticator app'}
            </p>
          </div>

          {!showBackupCode ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-textSecondary dark:text-textSecondary-dark mb-1">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  className="w-full px-3 py-2 border border-border dark:border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="trustDevice"
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border dark:border-border-dark rounded"
                />
                <label htmlFor="trustDevice" className="ml-2 block text-sm text-textSecondary dark:text-textSecondary-dark">
                  Trust this device for 30 days
                </label>
              </div>

              {error && (
                <div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error dark:text-status-error-dark px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-primary text-white dark:text-primary-on-dark py-2 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setShowBackupCode(true)}
                  className="block w-full text-sm text-primary hover:opacity-90"
                >
                  Use a backup code instead
                </button>
                <button
                  type="button"
                  onClick={handleUseEmailCode}
                  disabled={emailOtpSending}
                  className="block w-full text-sm text-primary hover:opacity-90 disabled:opacity-50"
                >
                  {emailOtpSending ? 'Sending...' : 'Send code to my email instead'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyBackupCode} className="space-y-4">
              <div>
                <label htmlFor="backupCode" className="block text-sm font-medium text-textSecondary dark:text-textSecondary-dark mb-1">
                  Backup Code
                </label>
                <input
                  id="backupCode"
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-border dark:border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary text-center font-mono"
                  placeholder="Enter backup code"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="trustDeviceBackup"
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-border dark:border-border-dark rounded"
                />
                <label htmlFor="trustDeviceBackup" className="ml-2 block text-sm text-textSecondary dark:text-textSecondary-dark">
                  Trust this device for 30 days
                </label>
              </div>

              {error && (
                <div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error dark:text-status-error-dark px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !backupCode}
                className="w-full bg-primary text-white dark:text-primary-on-dark py-2 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Backup Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowBackupCode(false);
                    setBackupCode('');
                    setError('');
                  }}
                  className="text-sm text-primary hover:opacity-90"
                >
                  Use authenticator code instead
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                clearPending2FAEmail();
                navigate('/login');
              }}
              className="text-sm text-textSecondary dark:text-textSecondary-dark hover:text-textPrimary dark:hover:text-textPrimary-dark"
            >
              Back to login
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-textSecondary dark:text-textSecondary-dark">
          <p>This page will timeout after 5 minutes for security.</p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorChallenge;
