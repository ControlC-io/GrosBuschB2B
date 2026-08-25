import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const Login = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-[calc(100vh-4rem)] flex">
      {/* Left panel: form */}
      <div className="w-full max-w-[460px] lg:w-[460px] bg-background dark:bg-background-dark border-r border-border dark:border-border-dark flex items-center justify-center px-6 sm:px-10">
        <div className="max-w-[360px] w-full space-y-8">
          {/* Brand header */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-surface dark:bg-surface-dark border border-border dark:border-border-dark flex items-center justify-center overflow-hidden">
              <span className="text-base font-bold text-primary">G</span>
            </span>
            <span className="text-[22px] font-bold tracking-tight text-textPrimary dark:text-textPrimary-dark">
              GrosBuschB2B
            </span>
          </div>

          {/* Title block */}
          <div className="space-y-1">
            <h1 className="text-[20px] font-bold text-textPrimary dark:text-textPrimary-dark">
              Welcome back
            </h1>
            <p className="text-[14px] text-textSecondary dark:text-textSecondary-dark">
              Sign in to access your account
            </p>
          </div>

          {/* Form */}
          <LoginForm onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Right panel: decorative gradient */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-700 to-background-dark" />

        <div className="relative z-10 flex flex-col items-center justify-center px-10 text-center text-white">
          <div className="mb-4 text-3xl">
            <span role="img" aria-label="Padlock">🔒</span>
          </div>
          <p className="text-[22px] font-semibold leading-snug max-w-xl">
            Secure, production-ready template with 2FA, RBAC, and DMZ architecture.
          </p>
          <p className="mt-4 text-sm text-white/70">
            Secure · Scalable · Ready to customise
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
