import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Header search available on every page. On the catalog it updates the query
 * string while typing. From any other route it opens the catalog on submit.
 */
const GlobalSearch = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCatalog = location.pathname === '/catalog';
  const urlSearch = isCatalog ? (searchParams.get('search') ?? '') : '';
  const [value, setValue] = useState(urlSearch);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (dirtyRef.current) return;
    setValue(urlSearch);
  }, [urlSearch]);

  const applyTerm = (term: string) => {
    dirtyRef.current = false;
    if (isCatalog) {
      const next = new URLSearchParams(searchParams);
      if (term.length > 0) next.set('search', term);
      else next.delete('search');
      setSearchParams(next, { replace: true });
      return;
    }
    if (term.length > 0) {
      navigate(`/catalog?search=${encodeURIComponent(term)}`);
    } else {
      navigate('/catalog');
    }
  };

  useEffect(() => {
    if (!dirtyRef.current || !isCatalog) return undefined;

    const timer = window.setTimeout(() => {
      applyTerm(value.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, isCatalog, navigate, searchParams, setSearchParams]);

  return (
    <form
      className="flex w-full min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        dirtyRef.current = true;
        applyTerm(value.trim());
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(event) => {
          dirtyRef.current = true;
          setValue(event.target.value);
        }}
        placeholder={t('catalog.searchPlaceholder')}
        aria-label={t('catalog.searchPlaceholder')}
        className="h-11 min-w-0 flex-1 rounded-none border border-r-0 border-border bg-[#F3F4F6] px-4 text-sm italic text-textPrimary placeholder:text-textSecondary focus:border-textPrimary focus:bg-white focus:not-italic focus:outline-none dark:border-border-dark dark:bg-background-dark dark:text-textPrimary-dark dark:focus:bg-surface-dark"
      />
      <button
        type="submit"
        className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#4B5563] text-white hover:bg-[#374151]"
        aria-label={t('nav.searchSubmit')}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
      </button>
    </form>
  );
};

export default GlobalSearch;
