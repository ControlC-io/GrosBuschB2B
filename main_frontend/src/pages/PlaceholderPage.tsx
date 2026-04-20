import { useTranslation } from "react-i18next";

interface PlaceholderPageProps {
  titleKey: string;
}

const PlaceholderPage = ({ titleKey }: PlaceholderPageProps) => {
  const { t } = useTranslation("common");

  return (
    <div className="bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-surface dark:bg-surface-dark rounded-xl shadow-sm border border-border dark:border dark:border-border-dark p-8 space-y-4">
          <h1 className="text-2xl font-bold text-textPrimary dark:text-textPrimary-dark">{t(titleKey)}</h1>
          <p className="text-sm text-textSecondary dark:text-textSecondary-dark">
            {t("placeholders.underConstruction")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;

