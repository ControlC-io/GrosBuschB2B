import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';

const Register = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl p-8 max-w-md w-full border border-border dark:border dark:border-border-dark">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-textPrimary dark:text-textPrimary-dark mb-2">Create Account</h1>
          <p className="text-textSecondary dark:text-textSecondary-dark">Get started with DMZ Auth</p>
        </div>

        <RegisterForm onSuccess={handleSuccess} />

        <div className="mt-6 text-center text-sm text-textSecondary dark:text-textSecondary-dark">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:opacity-90 font-medium">
            Sign in
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-textSecondary dark:text-textSecondary-dark hover:text-textPrimary dark:hover:text-textPrimary-dark">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
