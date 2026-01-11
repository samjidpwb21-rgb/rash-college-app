"use client"

// ============================================================================
// REACT HOOK: USE PWA INSTALL
// ============================================================================
// Client-side hook for managing PWA install prompt and state

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePwaInstallReturn {
    isInstallable: boolean
    isInstallPromptAvailable: boolean
    isInstalled: boolean
    promptInstall: () => Promise<boolean>
    dismissPrompt: () => void
    isDismissed: boolean
}

export function usePwaInstall(): UsePwaInstallReturn {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isInstallable, setIsInstallable] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return

        // Check if app is already installed
        const checkInstalled = () => {
            // Check if running in standalone mode (installed PWA)
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            // @ts-ignore - navigator.standalone is iOS-specific
            const isIOSStandalone = window.navigator.standalone === true
            setIsInstalled(isStandalone || isIOSStandalone)
        }

        checkInstalled()

        // Check if user previously dismissed the prompt (SESSION storage now)
        const dismissed = sessionStorage.getItem('pwa-install-dismissed')
        if (dismissed === 'true') {
            setIsDismissed(true)
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setIsInstallable(true)
        }

        // Listen for successful install
        const handleAppInstalled = () => {
            setIsInstalled(true)
            setIsInstallable(false)
            setDeferredPrompt(null)
            sessionStorage.removeItem('pwa-install-dismissed')
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    // Trigger install prompt
    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) {
            return false
        }

        try {
            await deferredPrompt.prompt()
            const choiceResult = await deferredPrompt.userChoice

            if (choiceResult.outcome === 'accepted') {
                setIsInstalled(true)
                setIsInstallable(false)
                setDeferredPrompt(null)
                sessionStorage.removeItem('pwa-install-dismissed')
                return true
            } else {
                // User dismissed the prompt
                return false
            }
        } catch (err) {
            console.error('Error showing install prompt:', err)
            return false
        }
    }, [deferredPrompt])

    // Dismiss prompt (session persistence)
    const dismissPrompt = useCallback(() => {
        setIsDismissed(true)
        sessionStorage.setItem('pwa-install-dismissed', 'true')
    }, [])

    return {
        // "isInstallable" for the consumer means: available, not installed, not dismissed
        isInstallable: isInstallable && !isInstalled && !isDismissed,

        // Expose raw availability for custom logic (ignores dismissal)
        isInstallPromptAvailable: isInstallable && !isInstalled,

        // Expose raw states
        isInstalled,
        promptInstall,
        dismissPrompt,
        isDismissed,
    }
}
