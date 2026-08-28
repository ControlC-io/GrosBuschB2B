import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@shared/auth';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

const TwoFactorSetup = ({ onComplete, onCancel }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<'password' | 'qrcode' | 'verify' | 'backup'>('password');
  const [password, setPassword] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { enable2FA, verify2FASetup } = useAuth();

  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await enable2FA(password);
      setTotpUri(data.totpURI);
      setBackupCodes(data.backupCodes);
      setStep('qrcode');
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FASetup(verificationCode);
      setStep('backup');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {step === 'password' && (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-lg p-8 border border-border dark:border dark:border-border-dark">
          <h2 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark mb-4">Enable Two-Factor Authentication</h2>
          <p className="text-textSecondary dark:text-textSecondary-dark mb-6">
            Add an extra layer of security to your account by enabling two-factor authentication.
            You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
          </p>

          <form onSubmit={handleEnableTwoFactor} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textSecondary dark:text-textSecondary-dark mb-1">
                Confirm Your Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border dark:border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error dark:text-status-error-dark px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white dark:text-primary-on-dark py-2 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-border dark:border-border-dark rounded-lg hover:bg-background dark:hover:bg-background-dark text-textSecondary dark:text-textSecondary-dark"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {step === 'qrcode' && (
            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-lg p-8 border border-border dark:border dark:border-border-dark">
          <h2 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark mb-4">Scan QR Code</h2>
          <p className="text-textSecondary dark:text-textSecondary-dark mb-6">
            Open your authenticator app and scan this QR code to add your account.
          </p>

          <div className="flex flex-col items-center space-y-6">
            <div className="bg-surface dark:bg-surface-dark p-4 rounded-lg border-2 border-border dark:border dark:border-border-dark">
              <QRCodeSVG value={totpUri} size={256} />
            </div>

            <div className="w-full bg-background dark:bg-background-dark p-4 rounded-lg">
              <p className="text-sm text-textSecondary dark:text-textSecondary-dark mb-2">Or enter this code manually:</p>
              <code className="text-sm bg-surface dark:bg-surface-dark px-3 py-2 rounded border border-border dark:border dark:border-border-dark block break-all">
                {totpUri.split('secret=')[1]?.split('&')[0]}
              </code>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-primary text-white dark:text-primary-on-dark py-2 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Next: Verify Code
            </button>
          </div>
        </div>
      )}

      {step === 'verify' && (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-lg p-8 border border-border dark:border dark:border-border-dark">
          <h2 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark mb-4">Verify Your Code</h2>
          <p className="text-textSecondary dark:text-textSecondary-dark mb-6">
            Enter the 6-digit code from your authenticator app to complete setup.
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-textSecondary dark:text-textSecondary-dark mb-1">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="w-full px-3 py-2 border border-border dark:border dark:border-border-dark rounded-lg bg-surface dark:bg-surface-dark focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="bg-status-error-bg dark:bg-status-error-bg-dark text-status-error dark:text-status-error-dark px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('qrcode')}
                className="px-4 py-2 border border-border dark:border dark:border-border-dark rounded-lg hover:bg-background dark:hover:bg-background-dark text-textSecondary dark:text-textSecondary-dark"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-primary text-white dark:text-primary-on-dark py-2 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 'backup' && (
        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-lg p-8 border border-border dark:border dark:border-border-dark">
          <h2 className="text-2xl font-bold text-status-success dark:text-status-success-dark mb-4">2FA Enabled Successfully!</h2>
          <p className="text-textSecondary dark:text-textSecondary-dark mb-6">
            Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
          </p>

          <div className="bg-status-warning-bg dark:bg-status-warning-bg-dark rounded-lg p-4 mb-6">
            <p className="text-sm text-status-warning dark:text-status-warning-dark font-semibold mb-2">Important:</p>
            <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
              Each backup code can only be used once. Store them securely and do not share them with anyone.
            </p>
          </div>

          <div className="bg-background dark:bg-background-dark p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {backupCodes.map((code, index) => (
                <code key={index} className="text-sm bg-surface dark:bg-surface-dark px-3 py-2 rounded border border-border dark:border dark:border-border-dark text-center font-mono">
                  {code}
                </code>
              ))}
            </div>
            <button
              onClick={handleCopyBackupCodes}
              className="w-full px-4 py-2 border border-border dark:border dark:border-border-dark rounded-lg hover:bg-surface dark:hover:bg-surface-dark text-sm text-textSecondary dark:text-textSecondary-dark"
            >
              Copy All Codes
            </button>
          </div>

          <button
            onClick={handleComplete}
            className="w-full bg-primary text-white dark:text-primary-on-dark py-2 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
