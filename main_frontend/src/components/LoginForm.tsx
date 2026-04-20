import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@shared/auth';
import { setPending2FAEmail } from '../authStorage';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { t } = useTranslation('common');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.twoFactorRedirect) {
        setPending2FAEmail(email);
        navigate('/auth/2fa-challenge');
        return;
      }

      if (result.emailOtpRequired) {
        navigate('/auth/email-otp');
        return;
      }

      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.form.loginFailed');
      if (message.match(/two-factor|2FA|TOTP/i)) {
        setPending2FAEmail(email);
        navigate('/auth/2fa-challenge');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-semibold text-textPrimary dark:text-textPrimary-dark mb-1"
            >
              {t('auth.form.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-sm text-textPrimary dark:text-textPrimary-dark placeholder:text-textSecondary/70 dark:placeholder:text-textSecondary-dark/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
              placeholder={t('auth.form.emailPlaceholder')}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-semibold text-textPrimary dark:text-textPrimary-dark mb-1"
            >
              {t('auth.form.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-sm text-textPrimary dark:text-textPrimary-dark placeholder:text-textSecondary/70 dark:placeholder:text-textSecondary-dark/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
              placeholder={t('auth.form.passwordPlaceholder')}
            />
          </div>
        </div>

        {/* 2FA divider */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 border-t border-border" />
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-textSecondary dark:text-textSecondary-dark">
            {t('auth.twoFactor.title')}
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* 2FA code input */}
        <div>
          <label
            htmlFor="code"
            className="block text-[13px] font-semibold text-textPrimary dark:text-textPrimary-dark mb-1"
          >
            {t('auth.twoFactor.codeLabel')}
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-3 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-base text-textPrimary dark:text-textPrimary-dark text-center tracking-[0.6em] placeholder:text-textSecondary/60 dark:placeholder:text-textSecondary-dark/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            placeholder="0 0 0 0 0 0"
          />
        </div>
      </div>

      {/* Hints */}
      <div className="flex flex-col gap-3 text-sm text-textSecondary dark:text-textSecondary-dark">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
            ?
          </span>
          <p>{t('auth.twoFactor.description')}</p>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
            ✉
          </span>
          <p>
            {t('auth.twoFactor.sendEmailCode')}{' '}
            <button
              type="button"
              className="text-primary font-medium underline-offset-2 hover:underline transition-colors duration-200"
            >
              {t('auth.twoFactor.sendEmailCode')}
            </button>
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-status-error dark:text-status-error-dark">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-lg font-bold uppercase tracking-wide py-2.5 transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? t('auth.form.loginButtonLoading') : t('auth.form.loginButton')}
        </button>

        <p className="text-xs text-textSecondary dark:text-textSecondary-dark text-center">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-primary hover:opacity-90 transition-opacity duration-200">
            {t('auth.login.createOne')}
          </Link>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
