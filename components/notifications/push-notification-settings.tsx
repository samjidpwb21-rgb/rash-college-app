"use client"

// ============================================================================
// PUSH NOTIFICATION SETTINGS
// ============================================================================
// Persistent toggle control for enabling/disabling push notifications

import { Bell, BellOff, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function PushNotificationSettings() {
    const { isSupported, permission, isSubscribed, isLoading, error, subscribe, unsubscribe } = usePushNotifications()

    // Show error toast if there's an error
    useEffect(() => {
        if (error) {
            toast.error(error)
        }
    }, [error])

    const handleToggle = async (checked: boolean) => {
        console.log('[Settings] Toggle clicked:', checked)

        if (checked) {
            // Enable push notifications
            console.log('[Settings] Attempting to enable push notifications...')
            const success = await subscribe()
            if (success) {
                toast.success('Push notifications enabled!')
            } else {
                toast.error('Failed to enable push notifications. Check console for details.')
            }
        } else {
            // Disable push notifications
            console.log('[Settings] Attempting to disable push notifications...')
            const success = await unsubscribe()
            if (success) {
                toast.success('Push notifications disabled')
            } else {
                toast.error('Failed to disable push notifications')
            }
        }
    }

    // Don't show if browser doesn't support push
    if (!isSupported) {
        return null
    }

    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isSubscribed ? (
                            <Bell className="h-5 w-5 text-primary" />
                        ) : (
                            <BellOff className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                            <CardTitle className="text-base">Push Notifications</CardTitle>
                            <CardDescription className="text-sm">
                                {isSubscribed
                                    ? 'Receive notifications even when the app is closed'
                                    : 'Enable to get instant notifications on your device'
                                }
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="push-toggle" className="text-sm text-muted-foreground cursor-pointer">
                            {isLoading ? 'Loading...' : isSubscribed ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                            id="push-toggle"
                            checked={isSubscribed}
                            onCheckedChange={handleToggle}
                            disabled={isLoading || permission === 'denied'}
                        />
                    </div>
                </div>
            </CardHeader>
            {permission === 'denied' && (
                <CardContent className="pt-0">
                    <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>
                            Push notifications are blocked. Please enable them in your browser settings.
                        </p>
                    </div>
                </CardContent>
            )}
            {error && permission !== 'denied' && (
                <CardContent className="pt-0">
                    <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
