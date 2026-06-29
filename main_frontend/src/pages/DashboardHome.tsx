import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface DashboardLink {
  id: string;
  titleKey: string;
  to: string;
}

const CounterIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12h4l3-9 4 18 3-9h4" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="9" r="3.2" />
    <path d="M6.5 18.5C7.7 16.6 9.7 15.5 12 15.5s4.3 1.1 5.5 3" />
    <circle cx="12" cy="12" r="7.5" />
  </svg>
);

const FileIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9A2.5 2.5 0 0 0 19 18.5V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </svg>
);

const PuzzleIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 3h6v3a2 2 0 0 0 4 0V3h.5A1.5 1.5 0 0 1 21 4.5v5h-3a2 2 0 0 0 0 4h3v5.5A1.5 1.5 0 0 1 19.5 21H4.5A1.5 1.5 0 0 1 3 19.5V14h3a2 2 0 0 0 0-4H3V4.5A1.5 1.5 0 0 1 4.5 3H9z" />
  </svg>
);

const LayoutIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3.5 6 5.7v6.6c0 3.2 2.4 5.8 6 7.2 3.6-1.4 6-4 6-7.2V5.7z" />
    <path d="M9.5 12.5 11 14l3.5-3.5" />
  </svg>
);

const getIconForLink = (id: DashboardLink['id']) => {
  switch (id) {
    case 'counter': return <CounterIcon />;
    case 'profile': return <ProfileIcon />;
    case 'documents': return <FileIcon />;
    case 'feature-one': return <PuzzleIcon />;
    case 'feature-two': return <LayoutIcon />;
    case 'feature-three': return <StarIcon />;
    case 'admin': return <ShieldIcon />;
    default: return <PuzzleIcon />;
  }
};

const links: DashboardLink[] = [
  { id: 'counter', titleKey: 'dashboard.links.counter', to: '/dashboard' },
  { id: 'profile', titleKey: 'dashboard.links.profile', to: '/info' },
  { id: 'documents', titleKey: 'dashboard.links.documents', to: '/documents' },
  { id: 'feature-two', titleKey: 'dashboard.links.featureTwo', to: '/features/example-two' },
  { id: 'feature-three', titleKey: 'dashboard.links.featureThree', to: '/features/example-three' },
  { id: 'admin', titleKey: 'dashboard.links.admin', to: 'http://localhost:8080' },
];

const DashboardHome = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  const handleClick = (link: DashboardLink) => {
    if (link.to.startsWith('http')) {
      window.open(link.to, '_blank', 'noopener,noreferrer');
    } else {
      navigate(link.to);
    }
  };

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-[calc(100vh-4rem)] flex">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center">
        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-sm px-6 sm:px-8 py-8 sm:py-10 space-y-8">
          <header className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-textPrimary dark:text-textPrimary-dark">
              {t('dashboard.welcomeTitle', { brand: 'AppTemplate' })}
            </h1>
            <p className="max-w-3xl mx-auto text-sm sm:text-base text-textSecondary dark:text-textSecondary-dark">
              {t('dashboard.welcomeDescription')}
            </p>
          </header>

          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleClick(link)}
                className="group relative flex flex-col items-center justify-center rounded-xl px-3 py-5 text-textPrimary dark:text-textPrimary-dark hover:bg-background dark:hover:bg-background-dark transition-all focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-0"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-icon-dark flex items-center justify-center text-textPrimary dark:text-textPrimary-dark group-hover:border-primary group-hover:text-primary transition-colors">
                    {getIconForLink(link.id)}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-textPrimary dark:text-textPrimary-dark text-center leading-snug mt-1">
                    {t(link.titleKey)}
                  </p>
                </div>
              </button>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
