import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-slate-900">
            {/* Sidebar Skeleton (hidden on mobile, visible lg) */}
            <div className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-slate-800 bg-slate-900/50">
                <div className="flex h-[60px] items-center px-6">
                    <Skeleton className="h-8 w-32 bg-slate-800" />
                </div>
                <div className="flex-1 space-y-2 p-4">
                    <Skeleton className="h-10 w-full bg-slate-800" />
                    <Skeleton className="h-10 w-full bg-slate-800" />
                    <Skeleton className="h-10 w-full bg-slate-800" />
                    <Skeleton className="h-10 w-full bg-slate-800" />
                </div>
            </div>

            <div className="lg:ml-64">
                {/* Header Skeleton */}
                <header className="sticky top-0 z-40 flex h-[60px] items-center gap-4 border-b border-slate-800 bg-slate-900/95 px-4 lg:px-6">
                    <Skeleton className="h-6 w-48 bg-slate-800" />
                    <div className="ml-auto flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full bg-slate-800" />
                    </div>
                </header>

                <main className="p-4 sm:p-6 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <Skeleton className="h-28 w-full rounded-xl bg-slate-800" />
                        <Skeleton className="h-28 w-full rounded-xl bg-slate-800" />
                        <Skeleton className="h-28 w-full rounded-xl bg-slate-800" />
                        <Skeleton className="h-28 w-full rounded-xl bg-slate-800" />
                    </div>

                    {/* Content Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Skeleton className="h-[350px] lg:col-span-2 rounded-xl bg-slate-800" />
                        <Skeleton className="h-[350px] lg:col-span-1 rounded-xl bg-slate-800" />
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton className="h-[300px] rounded-xl bg-slate-800" />
                        <Skeleton className="h-[300px] rounded-xl bg-slate-800" />
                    </div>
                </main>
            </div>
        </div>
    )
}
