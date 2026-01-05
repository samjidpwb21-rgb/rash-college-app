import type React from "react"
import Link from "next/link"
import Image from "next/image"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/30 via-primary to-primary" />
        <div className="relative z-10 flex flex-col h-full p-12 text-primary-foreground">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 overflow-hidden relative">
              <Image
                src="/uploads/icon/logo7.png"
                alt="R.A.S.H College App"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-semibold">R.A.S.H College App</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center w-[75%]">
            <h2 className="text-2xl md:text-3xl font-medium leading-normal">
              &ldquo;R.A.S.H simplifies campus life by bringing attendance, events, and communication into one seamless platform — built for students, trusted by faculty.&rdquo;
            </h2>
          </div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden relative">
                <Image
                  src="/uploads/icon/logo7.png"
                  alt="R.A.S.H College App"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-semibold text-foreground">R.A.S.H College App</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">{description}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
