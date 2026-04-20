import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth';
import { useState } from 'react';
import TwoFactorSetup from '../components/TwoFactorSetup';
import Counter from '../components/Counter';

const InfoPage = () => {
  const { user, logout, disable2FA, checkSession } = useAuth();
  const navigate = useNavigate();
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDisable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionError('');
    setActionLoading(true);

    try {
      await disable2FA(disablePassword);
      setShowDisable2FA(false);
      setDisablePassword('');
      await checkSession();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handle2FASetupComplete = async () => {
    setShow2FASetup(false);
    await checkSession();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border dark:border-border-dark shadow-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-textPrimary dark:text-textPrimary-dark mb-2">Info</h1>
              <p className="text-textSecondary dark:text-textSecondary-dark">Detailed information about your account and architecture</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>

          <div className="bg-primary rounded-lg p-6 text-white mb-8">
            <h2 className="text-2xl font-bold mb-2">Hello, {user.name || 'User'}!</h2>
            <p className="opacity-80">{user.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 border border-border dark:border dark:border-border-dark">
              <h3 className="font-semibold text-textPrimary dark:text-textPrimary-dark mb-4">User Information</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-textSecondary dark:text-textSecondary-dark">User ID</dt>
                  <dd className="text-textPrimary dark:text-textPrimary-dark font-mono text-sm">{user.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-textSecondary dark:text-textSecondary-dark">Email</dt>
                  <dd className="text-textPrimary dark:text-textPrimary-dark">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-textSecondary dark:text-textSecondary-dark">Name</dt>
                  <dd className="text-textPrimary dark:text-textPrimary-dark">{user.name || 'Not set'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 border border-border dark:border dark:border-border-dark">
              <h3 className="font-semibold text-textPrimary dark:text-textPrimary-dark mb-4">Architecture Status</h3>
              <div className="space-y-2 text-sm text-textSecondary dark:text-textSecondary-dark">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-textSecondary dark:text-textSecondary-dark">NGINX Reverse Proxy (DMZ)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-textSecondary dark:text-textSecondary-dark">React Frontend (DMZ)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-textSecondary dark:text-textSecondary-dark">Express Backend (Internal)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-textSecondary dark:text-textSecondary-dark">PostgreSQL Database (Internal)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-textSecondary dark:text-textSecondary-dark">Better Auth Authentication</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Counter />
          </div>

          <div className="mt-8 bg-surface dark:bg-surface-dark rounded-lg p-6 border border-border dark:border dark:border-border-dark">
            <h3 className="font-semibold text-textPrimary dark:text-textPrimary-dark mb-4">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-textPrimary dark:text-textPrimary-dark">Two-Factor Authentication</p>
                  <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
                    {user.twoFactorEnabled 
                      ? 'Your account is protected with 2FA'
                      : 'Add an extra layer of security to your account'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.twoFactorEnabled 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                      : 'bg-primary text-textPrimary dark:bg-surface-dark dark:text-textPrimary-dark'
                  }`}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {user.twoFactorEnabled ? (
                    <button
                      onClick={() => setShowDisable2FA(true)}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => setShow2FASetup(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      Enable 2FA
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-primary rounded-lg p-4 border border-border dark:border dark:border-border-dark text-primary-on-light dark:text-primary-on-dark">
            <p className="text-sm">
              <span className="font-semibold">Security Note:</span> Your session is protected by HTTP-only cookies and all traffic flows through the secure DMZ architecture.
            </p>
          </div>
        </div>

        {show2FASetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface dark:bg-surface-dark rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border dark:border dark:border-border-dark">
              <TwoFactorSetup 
                onComplete={handle2FASetupComplete}
                onCancel={() => setShow2FASetup(false)}
              />
            </div>
          </div>
        )}

        {showDisable2FA && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface dark:bg-surface-dark rounded-lg max-w-md w-full p-6 border border-border dark:border dark:border-border-dark">
              <h2 className="text-xl font-bold text-textPrimary dark:text-textPrimary-dark mb-4">Disable Two-Factor Authentication</h2>
              <p className="text-textSecondary dark:text-textSecondary-dark mb-6">
                Are you sure you want to disable 2FA? This will make your account less secure.
              </p>

              <form onSubmit={handleDisable2FA} className="space-y-4">
                <div>
                  <label htmlFor="disablePassword" className="block text-sm font-medium text-textSecondary dark:text-textSecondary-dark mb-1">
                    Confirm Your Password
                  </label>
                  <input
                    id="disablePassword"
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-border dark:border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your password"
                  />
                </div>

                {actionError && (
                  <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-lg">
                    {actionError}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisable2FA(false);
                      setDisablePassword('');
                      setActionError('');
                    }}
                    className="flex-1 px-4 py-2 border border-border dark:border dark:border-border-dark rounded-lg hover:bg-background dark:hover:bg-background-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Disabling...' : 'Disable 2FA'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPage;
