type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-shimmer rounded-md bg-velox-elevated ${className}`.trim()}
      aria-hidden
    />
  );
}
