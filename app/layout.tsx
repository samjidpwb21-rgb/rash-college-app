import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import GlobalLoaderWrapper from "@/components/ui/global-loader-wrapper"
import { RouteLoader } from "@/components/route-loader"
import { LoadingProvider } from "@/contexts/loading-context"
import { ThemeProvider } from "@/components/providers/theme-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "R.A.S.H College App",
  description:
    "Modern attendance tracking, student records, course management, and analytics for educational institutions",
  generator: 'v0.app',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RASH College',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoadingProvider>
            <Suspense fallback={null}>
              <GlobalLoaderWrapper />
              <RouteLoader />
            </Suspense>
            {children}
          </LoadingProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
