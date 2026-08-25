const PLACEHOLDER_COUNT = 8;

const CatalogSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
    {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
      <div
        key={index}
        className="animate-pulse rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-3"
      >
        <div className="h-36 rounded bg-background dark:bg-background-dark" />
        <div className="mt-3 h-3 w-4/5 rounded bg-background dark:bg-background-dark" />
        <div className="mt-2 h-3 w-2/5 rounded bg-background dark:bg-background-dark" />
        <div className="mt-4 flex items-center justify-between">
          <div className="h-5 w-16 rounded bg-background dark:bg-background-dark" />
          <div className="h-7 w-20 rounded bg-background dark:bg-background-dark" />
        </div>
      </div>
    ))}
  </div>
);

export default CatalogSkeleton;
