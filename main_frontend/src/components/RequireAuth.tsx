import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@shared/auth";

/**
 * Layout guard for authenticated routes. Renders children (via Outlet) only when
 * the user is logged in; shows a consistent loading state and redirects to /login otherwise.
 */
const RequireAuth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center">
        <p className="text-textSecondary dark:text-textSecondary-dark text-sm">
          {t("placeholders.loading")}
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAuth;
