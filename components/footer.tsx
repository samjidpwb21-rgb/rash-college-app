import Link from "next/link"
import Image from "next/image"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary overflow-hidden relative">
                <Image
                  src="/uploads/icon/logo7.png"
                  alt="R.A.S.H College App"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-xl font-semibold">R.A.S.H College App</span>
            </Link>
            <p className="text-sidebar-foreground/70 max-w-md">
              Modern attendance management system for educational institutions. Streamline tracking, reporting, and
              analytics.
            </p>
          </div>

          <div>
            {/* ... */}
          </div>
          {/* ... */}
          <div className="pt-8 border-t border-sidebar-border text-center text-sm text-sidebar-foreground/60">
            <p>&copy; {new Date().getFullYear()} R.A.S.H College App. All rights reserved.</p>
          </div>
        </div>
    </footer>
  )
}
