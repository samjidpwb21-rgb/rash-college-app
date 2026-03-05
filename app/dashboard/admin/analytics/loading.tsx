import { Skeleton } from "@/components/ui/skeleton"

// This file is shown INSTANTLY by Next.js Suspense while the analytics
// server component fetches data. It mirrors the layout of the analytics page.
export default function AnalyticsLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar skeleton */}
            <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-border bg-background">
                <div className="flex h-[60px] items-center px-6">
                    <Skeleton className="h-8 w-32" />
                </div>
                <div className="flex-1 space-y-2 p-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            <div className="lg:ml-64">
                {/* Header skeleton */}
                <header className="sticky top-0 z-40 flex h-[60px] items-center gap-4 border-b border-border bg-background/95 px-4 lg:px-6">
                    <Skeleton className="h-5 w-48" />
                    <div className="ml-auto flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </header>

                <main className="p-4 sm:p-6 space-y-6">
                    {/* Title + filter bar */}
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-52" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-9 w-36 rounded-md" />
                            <Skeleton className="h-9 w-24 rounded-md" />
                        </div>
                    </div>

                    {/* Stats cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-xl" />
                        ))}
                    </div>

                    {/* Chart row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton className="h-[340px] rounded-xl" />
                        <Skeleton className="h-[340px] rounded-xl" />
                    </div>

                    {/* Chart row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton className="h-[340px] rounded-xl" />
                        <Skeleton className="h-[340px] rounded-xl" />
                    </div>

                    {/* Full-width chart */}
                    <Skeleton className="h-[340px] rounded-xl" />
                </main>
            </div>
        </div>
    )
}
