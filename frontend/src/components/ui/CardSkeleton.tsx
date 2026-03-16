"use client";

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-xl border border-border bg-surface p-5 ${className}`}>
      <div className="mb-3 h-4 w-1/3 rounded bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-2/3 rounded bg-gray-100" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
      </div>
      <div className="mt-4 h-8 w-1/4 rounded bg-gray-100" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-7 w-48 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      </div>
      {/* Cards grid skeleton */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
