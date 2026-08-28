import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@shared/auth";
import LanguagePicker from "./LanguagePicker";
import ThemeToggle from "./ThemeToggle";
import GlobalSearch from "./GlobalSearch";
import CartButton from "./CartButton";
import FavoritesButton from "./FavoritesButton";
import BrandLogo from "./BrandLogo";
import {
  QUICK_LINKS,
  SHOP_CATEGORIES,
  catalogHrefFor,
  catalogHrefForShop,
  isCategoryActive,
  isQuickLinkActive,
  isShopNavActive,
  seasonalShopLabel,
} from "../config/navigation";
import { useSeasonalShops } from "../hooks/useSeasonalShops";

const iconClass = "h-7 w-7";

const QuickIcon = ({ name }: { name: "star" | "promo" | "catalog" }) => {
  if (name === "star") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3.5l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.36.92-5.34-3.88-3.78 5.36-.78L12 3.5z"
        />
      </svg>
    );
  }
  if (name === "promo") {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l6-6M10.2 10.2h.01M13.8 13.8h.01" />
      </svg>
    );
  }
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
};

const Navbar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation("common");
  const { user, logout, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const seasonalShops = useSeasonalShops();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const accountMenu = (
    <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-surface py-1 shadow-lg dark:border-border-dark dark:bg-surface-dark">
      {user ? (
        <>
          <div className="border-b border-border px-4 py-3 dark:border-border-dark">
            <p className="text-xs text-textSecondary dark:text-textSecondary-dark">{t("auth.signedInAs")}</p>
            <p className="mt-0.5 truncate text-sm font-medium" title={user.email}>
              {user.email}
            </p>
          </div>
          <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark">
            {t("nav.dashboard")}
          </Link>
          <Link to="/info" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark">
            {t("nav.info")}
          </Link>
          <Link to="/documents" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark">
            {t("dashboard.links.documents")}
          </Link>
          <Link to="/favorites" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark">
            {t("nav.favorites")}
          </Link>
          <a
            href="/admin-panel"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setProfileOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark"
          >
            {t("nav.admin")}
          </a>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm">{t("nav.theme")}</span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              logout();
            }}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-background dark:hover:bg-background-dark"
          >
            {t("auth.logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark">
            {t("auth.signIn")}
          </Link>
          <Link to="/register" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm hover:bg-background dark:hover:bg-background-dark">
            {t("auth.signUp")}
          </Link>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm">{t("nav.theme")}</span>
            <ThemeToggle />
          </div>
        </>
      )}
    </div>
  );

  return (
    <header className="relative sticky top-0 z-50 border-b border-border bg-surface font-sans text-textPrimary shadow-sm dark:border-navbar-border-dark dark:bg-navbar-dark dark:text-textPrimary-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 pt-3 pb-1 lg:gap-6">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 lg:hidden"
            aria-label={t("nav.menu")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <BrandLogo />

          <nav className="hidden items-center gap-5 lg:flex" aria-label={t("nav.quickLabel")}>
            {QUICK_LINKS.map((item) => {
              const active = isQuickLinkActive(item.to, searchParams, location.pathname);
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`flex w-14 flex-col items-center gap-1 ${
                    active ? "text-brand-green" : "text-textPrimary dark:text-textPrimary-dark"
                  }`}
                >
                  <QuickIcon name={item.icon} />
                  <span className="text-[0.62rem] font-bold uppercase tracking-wide">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden min-w-0 flex-1 sm:block">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-3 sm:ml-0">
            {!loading && (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex w-16 flex-col items-center gap-1 text-textPrimary dark:text-textPrimary-dark"
                  aria-label={t("nav.account")}
                  aria-expanded={profileOpen}
                >
                  <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="9" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 11.2a2.7 2.7 0 100-5.4 2.7 2.7 0 000 5.4zM7.2 17.4a5.4 5.4 0 019.6 0"
                    />
                  </svg>
                  <span className="text-[0.62rem] font-bold uppercase tracking-wide">{t("nav.account")}</span>
                </button>
                {profileOpen && accountMenu}
              </div>
            )}
            <FavoritesButton />
            {user && <CartButton />}
            <LanguagePicker />
          </div>
        </div>

        <div className="pb-1 sm:hidden">
          <GlobalSearch />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label={t("catalog.categoriesLabel")}
          className="flex items-center justify-center gap-5 overflow-x-auto"
        >
          {seasonalShops.map((shop) => {
            const active = isShopNavActive(shop.slug, searchParams, location.pathname);
            return (
              <Link
                key={shop.slug}
                to={catalogHrefForShop(shop.slug)}
                className={`relative shrink-0 border-b-[3px] py-2 text-[0.8rem] font-bold uppercase tracking-wide ${
                  active
                    ? "border-brand-orange text-brand-orange"
                    : "border-transparent text-textPrimary hover:text-brand-orange dark:text-textPrimary-dark"
                }`}
              >
                {seasonalShopLabel(shop, i18n.language)}
              </Link>
            );
          })}
          {seasonalShops.length > 0 && (
            <span className="hidden h-4 w-px shrink-0 bg-border sm:block dark:bg-border-dark" aria-hidden />
          )}
          {SHOP_CATEGORIES.map((item) => {
            const active = isCategoryActive(item, searchParams, location.pathname);
            return (
              <Link
                key={item.id}
                to={catalogHrefFor(item)}
                className={`relative shrink-0 border-b-[3px] py-2 text-[0.8rem] font-bold uppercase tracking-wide ${
                  active
                    ? "border-brand-green text-textPrimary dark:text-textPrimary-dark"
                    : "border-transparent text-textPrimary hover:text-brand-green dark:text-textPrimary-dark"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full z-40 h-[100dvh] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative flex h-full w-72 flex-col border-r border-border bg-surface shadow-lg dark:border-border-dark dark:bg-surface-dark">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 dark:border-border-dark">
              <span className="text-sm font-medium">{t("nav.menu")}</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label={t("nav.menu")}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div className="flex gap-4">
                {QUICK_LINKS.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex flex-col items-center gap-1 text-xs font-bold uppercase"
                  >
                    <QuickIcon name={item.icon} />
                    {t(item.labelKey)}
                  </Link>
                ))}
              </div>
              <div className="space-y-1 border-t border-border pt-3 dark:border-border-dark">
                {seasonalShops.length > 0 && (
                  <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-textSecondary dark:text-textSecondary-dark">
                    {t("nav.seasonalShops")}
                  </p>
                )}
                {seasonalShops.map((shop) => (
                  <Link
                    key={shop.slug}
                    to={catalogHrefForShop(shop.slug)}
                    onClick={() => setMobileOpen(false)}
                    className="block px-1 py-1.5 text-sm font-semibold uppercase text-brand-orange"
                  >
                    {seasonalShopLabel(shop, i18n.language)}
                  </Link>
                ))}
                {SHOP_CATEGORIES.map((item) => (
                  <Link
                    key={item.id}
                    to={catalogHrefFor(item)}
                    onClick={() => setMobileOpen(false)}
                    className="block px-1 py-1.5 text-sm font-semibold uppercase"
                  >
                    {t(item.labelKey)}
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-end border-t border-border pt-3 dark:border-border-dark">
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
