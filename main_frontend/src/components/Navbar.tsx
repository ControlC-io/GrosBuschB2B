import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@shared/auth";
import LanguagePicker from "./LanguagePicker";
import ThemeToggle from "./ThemeToggle";

type SubNavItem = {
  labelKey: string;
  to: string;
};

type PrimaryNavItem = {
  labelKey: string;
  to?: string;
  submenu?: SubNavItem[];
};

const primaryNavItems: PrimaryNavItem[] = [
  { labelKey: "nav.dashboard", to: "/dashboard" },
  {
    labelKey: "nav.features",
    submenu: [
      { labelKey: "pages.featureOne.title", to: "/features/example-one" },
      { labelKey: "pages.featureTwo.title", to: "/features/example-two" },
      { labelKey: "pages.featureThree.title", to: "/features/example-three" },
    ],
  },
];

const Navbar = () => {
  const location = useLocation();
  const { t } = useTranslation("common");
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string): boolean => location.pathname === path;

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-primary text-primary-on-light dark:text-primary-on-dark"
        : "text-textSecondary dark:text-textSecondary-dark hover:text-textPrimary dark:hover:text-textPrimary-dark hover:bg-primary/10 dark:hover:bg-white/10"
    }`;

  return (
    <header className="bg-surface dark:bg-navbar-dark border-b border-border dark:border-navbar-border-dark sticky top-0 z-50 shadow-sm font-sans text-textPrimary dark:text-textPrimary-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center gap-3">
            {/* Mobile menu button (only when authenticated) */}
            {user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-md text-textSecondary dark:text-textSecondary-dark hover:bg-primary/10 dark:hover:bg-white/10"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}

            {/* Brand */}
            <div className="flex items-center space-x-8">
              <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm overflow-hidden">
                  <span className="text-sm font-bold text-white">A</span>
                </span>
                <span className="text-lg font-bold tracking-tight text-textPrimary dark:text-textPrimary-dark">
                  App<span className="text-primary">Template</span>
                </span>
              </Link>

              {/* Desktop Nav: only visible when authenticated */}
              {user && (
                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                  {primaryNavItems.map((item) => (
                    <div key={item.labelKey} className="relative group">
                      {item.submenu ? (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-textSecondary dark:text-textSecondary-dark hover:text-textPrimary dark:hover:text-textPrimary-dark"
                          >
                            <span>{t(item.labelKey)}</span>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 hidden group-hover:block z-40">
                            <div className="relative">
                              <div className="absolute left-1/2 -top-1 w-3 h-3 bg-surface dark:bg-surface-dark border-l border-t border-border dark:border-border-dark rounded-tl-sm rotate-45 -translate-x-1/2" />
                              <div className="relative bg-surface dark:bg-surface-dark text-textPrimary dark:text-textPrimary-dark border border-border dark:border-border-dark rounded-lg shadow-lg py-2 min-w-[220px]">
                                {item.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.labelKey}
                                    to={subItem.to}
                                    className="flex items-center gap-3 px-4 py-2 text-sm text-textPrimary dark:text-textPrimary-dark hover:bg-background dark:hover:bg-background-dark transition-colors"
                                  >
                                    <span className="w-2.5 h-2.5 bg-primary rounded-sm rotate-45" />
                                    <span>{t(subItem.labelKey)}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Link
                          to={item.to ?? "#"}
                          className={navLinkClass(item.to ?? "#")}
                        >
                          {t(item.labelKey)}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <LanguagePicker />
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
            </div>
            {!loading && user ? (
              <div ref={profileRef} className="relative flex items-center gap-3">
                <button
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20 text-textPrimary dark:bg-icon-dark dark:text-textPrimary-dark dark:border dark:border-border-dark hover:bg-primary/30 dark:hover:bg-icon-dark/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-transparent"
                  aria-label="Profile menu"
                  aria-expanded={profileOpen}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-surface dark:bg-surface-dark rounded-lg shadow-lg border border-border dark:border-border-dark z-50">
                    <div className="px-4 py-3 border-b border-border/60 dark:border-border-dark/60">
                      <p className="text-xs text-textSecondary dark:text-textSecondary-dark">
                        {t("auth.signedInAs")}
                      </p>
                      <p
                        className="mt-0.5 text-sm font-medium text-textPrimary dark:text-textPrimary-dark truncate"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/info"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark"
                      >
                        <span className="w-4 h-4 rounded-full bg-primary/20 dark:bg-icon-dark flex items-center justify-center text-[10px] text-primary">
                          i
                        </span>
                        <span>{t("nav.info")}</span>
                      </Link>
                      <a
                        href="http://localhost:8080"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setProfileOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark"
                      >
                        <svg
                          className="w-4 h-4 text-textSecondary dark:text-textSecondary-dark"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span>{t("nav.admin")}</span>
                      </a>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4 text-textSecondary dark:text-textSecondary-dark"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        {t("auth.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !loading && (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-sm font-medium text-textPrimary dark:text-textPrimary-dark rounded-lg border border-border/60 dark:border-border-dark/60 hover:bg-primary/10 dark:hover:bg-white/10 transition-colors"
                  >
                    {t("auth.signIn")}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 text-sm font-medium text-primary-on-light bg-primary rounded-lg hover:opacity-90 transition-colors"
                  >
                    {t("auth.signUp")}
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {user && mobileOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-72 bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark shadow-lg flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-border dark:border-border-dark">
              <span className="text-sm font-medium text-textPrimary dark:text-textPrimary-dark">
                {t("nav.menu", "Menu")}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-md text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <div className="space-y-2">
                {primaryNavItems.map((item) => (
                  <div key={item.labelKey} className="space-y-1">
                    <div className="flex w-full items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-textPrimary dark:text-textPrimary-dark">
                      <span>{t(item.labelKey)}</span>
                      {item.submenu && (
                        <svg
                          className="w-4 h-4 text-textSecondary dark:text-textSecondary-dark"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                    {item.submenu && (
                      <div className="pl-6 space-y-0.5">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.labelKey}
                            to={subItem.to}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark"
                          >
                            <span className="w-2.5 h-2.5 bg-primary rounded-sm rotate-45" />
                            <span>{t(subItem.labelKey)}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {!item.submenu && item.to && (
                      <Link
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className="ml-3 px-3 py-1.5 rounded-md text-sm text-textSecondary dark:text-textSecondary-dark hover:bg-background dark:hover:bg-background-dark inline-flex"
                      >
                        {t(item.labelKey)}
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-border/70 dark:border-border-dark/70 flex items-center justify-end">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
