export function SkeletonCard() {
  return (
    <div className="skeleton" aria-hidden="true">
      <div className="skeleton-line h-lg w-70" />
      <div className="skeleton-line w-50" />
      <div className="skeleton-line w-30 h-sm" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

export function Spinner() {
  return (
    <div className="loading">
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  );
}
