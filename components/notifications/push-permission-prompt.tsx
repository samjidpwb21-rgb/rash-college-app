"use client"

// ============================================================================
// PUSH PERMISSION PROMPT COMPONENT
// ============================================================================
// Subtle, dismissible prompt to enable push notifications
// Shows once on first visit to notifications page

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function PushPermissionPrompt() {
    const [isDismissed, setIsDismissed] = useState(false)
    const [showPrompt, setShowPrompt] = useState(false)
    const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications()

    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return

        // Check if user has already dismissed the prompt
        const dismissed = localStorage.getItem('push-prompt-dismissed')

        // Show prompt if:
        // - Browser supports push
        // - User hasn't granted permission yet
        // - User hasn't subscribed
        // - User hasn't dismissed the prompt
        if (isSupported && permission !== 'granted' && !isSubscribed && !dismissed) {
            setShowPrompt(true)
        }
    }, [isSupported, permission, isSubscribed])

    const handleEnable = async () => {
        const success = await subscribe()
        if (success) {
            setShowPrompt(false)
            localStorage.setItem('push-prompt-dismissed', 'true')
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        setIsDismissed(true)
        localStorage.setItem('push-prompt-dismissed', 'true')
    }

    // Don't render if not showing prompt or already dismissed
    if (!showPrompt || isDismissed) {
        return null
    }

    return (
        <Card className="border-primary/20 bg-primary/5 mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Enable Push Notifications</CardTitle>
                            <CardDescription className="text-sm mt-1">
                                Get notified instantly when attendance is marked, notices are posted, or events are created
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mt-1 -mr-2"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleEnable}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <Bell className="h-4 w-4" />
                        {isLoading ? 'Enabling...' : 'Enable Notifications'}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        disabled={isLoading}
                    >
                        Maybe Later
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
