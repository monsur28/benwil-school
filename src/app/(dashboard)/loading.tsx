import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading state shaped like the pages it stands in for: a header band, a
 * divided metric row, then content panels. A skeleton that matches the real
 * layout stops the page from visibly jumping when data arrives.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-px w-full" />
      </div>

      <div className="panel grid divide-y divide-border-light sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 px-5 py-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-72 w-full rounded-2xl lg:col-span-8" />
        <Skeleton className="h-72 w-full rounded-2xl lg:col-span-4" />
      </div>
    </div>
  )
}
