import { cn } from "@/utils/cn";

export function SkeletonRow({ className }: { className?: string }) {
  return <div className={cn("h-4 w-full rounded bg-cyan-500/10 animate-pulse", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div data-component="ui-Skeleton" data-testid="component-ui-Skeleton" className={cn("glass-card p-4 space-y-3", className)}>
      <SkeletonRow className="w-1/3" />
      <SkeletonRow className="w-full" />
      <SkeletonRow className="w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonRow key={idx} className="h-8" />
      ))}
    </div>
  );
}
