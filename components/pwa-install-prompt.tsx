"use client"

// ============================================================================
// PWA INSTALL PROMPT COMPONENT
// ============================================================================
// Professional install prompt for PWA with dismissal and trigger

import { usePwaInstall } from '@/hooks/use-pwa-install'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface PwaInstallPromptProps {
    variant?: 'inline' | 'banner' | 'login-centered'
    className?: string
}

export function PwaInstallPrompt({ variant = 'inline', className = '' }: PwaInstallPromptProps) {
    const { isInstallable, isInstallPromptAvailable, promptInstall, dismissPrompt } = usePwaInstall()

    // Determine visibility based on variant
    const shouldShow = variant === 'login-centered' ? isInstallPromptAvailable : isInstallable

    if (!shouldShow) {
        return null
    }

    const handleInstall = async () => {
        await promptInstall()
    }

    if (variant === 'login-centered') {
        return (
            <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
                <div className="flex items-center gap-2">
                    {/* Using Next Image would be better but simple img works for assets */}
                    <img
                        src="/icons/icon-192x192.png"
                        alt="Logo"
                        className="w-12 h-12 rounded-lg shadow-md"
                    />
                </div>
                <Button
                    onClick={handleInstall}
                    size="default"
                    className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-lg animate-in fade-in zoom-in duration-300"
                >
                    <Download className="h-4 w-4" />
                    Install App
                </Button>
            </div>
        )
    }

    if (variant === 'banner') {
        return (
            <div className={`bg-primary/10 border border-primary/20 rounded-lg p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">Install R.A.S.H College App</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            Get quick access and work offline by installing the app on your device.
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={handleInstall} size="sm" variant="default">
                                Install App
                            </Button>
                            <Button onClick={dismissPrompt} size="sm" variant="ghost">
                                Not Now
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={dismissPrompt}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )
    }

    // Inline variant (button only)
    return (
        <Button
            onClick={handleInstall}
            variant="outline"
            size="sm"
            className={`gap-2 ${className}`}
        >
            <Download className="h-4 w-4" />
            Install App
        </Button>
    )
}
