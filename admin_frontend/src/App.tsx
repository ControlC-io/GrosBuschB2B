import { useState, useRef, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@shared/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TwoFactorChallenge from "./pages/TwoFactorChallenge";
import EmailOtpChallenge from "./pages/EmailOtpChallenge";
import { ThemeProvider, useTheme } from "./theme/ThemeProvider";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-surface dark:bg-surface-dark text-textPrimary dark:text-textPrimary-dark px-6 py-3 shadow-md border-b border-border dark:border-border-dark">
      <div className="max-w-7xl mx-auto flex items-center justify-between font-sans">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-on-light dark:text-secondary-on-dark">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">AppTemplate</span>
          <span className="text-textSecondary dark:text-textSecondary-dark text-sm font-medium uppercase tracking-widest hidden sm:inline">
            Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border dark:border-border-dark bg-background dark:bg-background-dark text-textSecondary dark:text-textSecondary-dark hover:bg-surface dark:hover:bg-surface-dark transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="4" strokeWidth="2" />
                <path strokeWidth="2" d="M12 3v2M12 19v2M5 12H3M21 12h-2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M5.64 18.36l1.42-1.42M16.94 7.06l1.42-1.42" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeWidth="2"
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                />
              </svg>
            )}
          </button>

          {user && (
            <div ref={profileRef} className="relative flex items-center gap-3">
              <span className="text-sm text-textSecondary dark:text-textSecondary-dark truncate max-w-[160px] sm:max-w-[220px]" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-on-light dark:text-primary-on-dark hover:opacity-90 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-surface dark:focus:ring-offset-surface-dark"
                aria-label="Profile menu"
                aria-expanded={profileOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 w-44 bg-surface dark:bg-surface-dark rounded-lg shadow-lg border border-border dark:border-border-dark z-50 text-textPrimary dark:text-textPrimary-dark">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-textSecondary dark:text-textSecondary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col text-textPrimary dark:text-textPrimary-dark font-sans">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/auth/2fa-challenge" element={<TwoFactorChallenge />} />
              <Route path="/auth/email-otp" element={<EmailOtpChallenge />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <>
                      <Header />
                      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<AdminDashboard />} />
                          <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                      </main>
                    </>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
