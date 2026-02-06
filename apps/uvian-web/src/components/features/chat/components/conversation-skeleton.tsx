interface ConversationSkeletonProps {
  className?: string;
}

export const ConversationSkeleton = ({
  className = '',
}: ConversationSkeletonProps) => {
  return (
    <div className={`group block p-4 rounded-xl border bg-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="text-right">
          <div className="h-3 w-16 bg-muted animate-pulse rounded mb-1" />
        </div>
      </div>
    </div>
  );
};
