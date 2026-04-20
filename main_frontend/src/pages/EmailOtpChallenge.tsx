import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth';
import {
  getPendingEmailOtpUserId,
  clearPendingAuthState,
} from '../authStorage';

const EmailOtpChallenge = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyEmailOtp, checkSession } = useAuth();
  const navigate = useNavigate();

  const userId = getPendingEmailOtpUserId();

  useEffect(() => {
    if (!userId) {
      // No pending OTP — nothing to verify, send back to login
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setError('');
    setLoading(true);

    try {
      await verifyEmailOtp(userId, code);
      clearPendingAuthState();
      // checkSession(true) uses flushSync so user state is committed before navigate().
      await checkSession(true);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl p-8 max-w-md w-full border border-border dark:border dark:border-border-dark">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 text-primary-on-light dark:text-primary-on-dark dark:bg-icon-dark dark:border dark:border-border-dark">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark mb-2">Check your email</h1>
          <p className="text-textSecondary dark:text-textSecondary-dark">
            We sent a 6-digit verification code to your email address. It expires in 10 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-textSecondary dark:text-textSecondary-dark mb-1">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              autoFocus
              className="w-full px-3 py-2 border border-border dark:border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>

          {error && (
            <div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error dark:text-status-error-dark px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-textSecondary dark:text-textSecondary-dark hover:text-textPrimary dark:hover:text-textPrimary-dark"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailOtpChallenge;
