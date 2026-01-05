"use client"

import type React from "react"

import { useState } from "react"
import { DashboardSidebar, MobileSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"

type UserRole = "student" | "faculty" | "admin"

interface DashboardLayoutProps {
  role: UserRole
  title: string
  user: {
    name: string
    email: string
    avatar?: string
    role: string
  }
  children: React.ReactNode
}

export function DashboardLayout({ role, title, user, children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <DashboardSidebar role={role} />

      {/* Mobile sidebar */}
      <MobileSidebar role={role} open={sidebarOpen} onOpenChange={setSidebarOpen} />

      <div className="lg:ml-64">
        <DashboardHeader title={title} user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 sm:p-6 space-y-6">{children}</main>
      </div>
    </div>
  )
}
