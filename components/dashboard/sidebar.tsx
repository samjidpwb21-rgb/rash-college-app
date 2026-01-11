"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  Users,
  User,
  Building2,
  Bell,
  CalendarCheck,
  ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SignOutDialog } from "@/components/ui/sign-out-dialog"

type UserRole = "student" | "faculty" | "admin"

interface SidebarProps {
  role: UserRole
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const menuItems = {
  student: [
    { href: "/dashboard/student", label: "Dashboard", icon: Home },
    { href: "/dashboard/student/attendance", label: "My Attendance", icon: ClipboardCheck },
    { href: "/dashboard/student/schedule", label: "Class Schedule", icon: Calendar },
    { href: "/dashboard/student/notices", label: "Notice Board", icon: Bell },
    { href: "/dashboard/student/events", label: "Events Calendar", icon: CalendarCheck },
  ],
  faculty: [
    { href: "/dashboard/faculty", label: "Dashboard", icon: Home },
    { href: "/dashboard/faculty/classes", label: "My Classes", icon: BookOpen },
    { href: "/dashboard/faculty/students", label: "Students", icon: Users },
    { href: "/dashboard/faculty/notices", label: "Notice Board", icon: Bell },
    { href: "/dashboard/faculty/events", label: "Events Calendar", icon: CalendarCheck },
    { href: "/dashboard/faculty/schedule", label: "Schedule", icon: Calendar },
  ],
  admin: [
    { href: "/dashboard/admin", label: "Dashboard", icon: Home },
    { href: "/dashboard/admin/users", label: "Users", icon: Users },
    { href: "/dashboard/admin/departments", label: "Departments", icon: Building2 },
    { href: "/dashboard/admin/semester-management", label: "Semester Management", icon: ArrowRightLeft },
    { href: "/dashboard/admin/courses", label: "Courses", icon: BookOpen },
    { href: "/dashboard/admin/attendance", label: "Attendance Progress", icon: ClipboardCheck },
    { href: "/dashboard/admin/notices", label: "Notice Board", icon: Bell },
    { href: "/dashboard/admin/events", label: "Events Calendar", icon: CalendarCheck },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: Building2 },
  ],
}

const roleLabels = {
  student: "Student Portal",
  faculty: "Faculty Portal",
  admin: "Admin Portal",
}

function SidebarContent({ role, onItemClick, onSignOutClick }: { role: UserRole; onItemClick?: () => void; onSignOutClick?: () => void }) {
  const pathname = usePathname()
  const items = menuItems[role]

  return (
    <>
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2" onClick={onItemClick}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary overflow-hidden relative">
            <Image
              src="/uploads/icon/logo7.png"
              alt="R.A.S.H College App"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <span className="text-lg font-semibold text-sidebar-foreground">R.A.S.H College App</span>
            <p className="text-xs text-sidebar-foreground/60">{roleLabels[role]}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        <Link
          href={`/dashboard/${role}/notifications`}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === `/dashboard/${role}/notifications`
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <Bell className="h-5 w-5" />
          Notifications
        </Link>
        <Link
          href={`/dashboard/${role}/settings`}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            pathname === `/dashboard/${role}/settings`
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2.5 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={() => {
            onItemClick?.()
            onSignOutClick?.()
          }}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </>
  )
}

export function MobileSidebar({ role, open, onOpenChange }: SidebarProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarContent
            role={role}
            onItemClick={() => onOpenChange?.(false)}
            onSignOutClick={() => setShowSignOutDialog(true)}
          />
        </SheetContent>
      </Sheet>
      <SignOutDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog} />
    </>
  )
}

export function DashboardSidebar({ role }: SidebarProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col hidden lg:flex">
        <SidebarContent role={role} onSignOutClick={() => setShowSignOutDialog(true)} />
      </aside>
      <SignOutDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog} />
    </>
  )
}
