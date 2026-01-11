"use client"

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

interface FacultyStudentsPageWrapperProps {
    user: {
        name: string
        email: string
        role: string
        avatar?: string | null
    }
    children: React.ReactNode
}

export function FacultyStudentsPageWrapper({ user, children }: FacultyStudentsPageWrapperProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-900">
            <DashboardSidebar role="faculty" />
            <MobileSidebar role="faculty" open={sidebarOpen} onOpenChange={setSidebarOpen} />

            <div className="lg:ml-64">
                <DashboardHeader
                    title="Students"
                    user={user}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
