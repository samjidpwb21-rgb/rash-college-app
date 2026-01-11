"use client"

// ============================================================================
// PUSH NOTIFICATION SETTINGS
// ============================================================================
// Persistent toggle control for enabling/disabling push notifications

import { Bell, BellOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { toast } from 'sonner'

export function PushNotificationSettings() {
    const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()

    const handleToggle = async (checked: boolean) => {
        if (checked) {
            // Enable push notifications
            const success = await subscribe()
            if (success) {
                toast.success('Push notifications enabled!')
            } else {
                toast.error('Failed to enable push notifications')
            }
        } else {
            // Disable push notifications
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
                            {isSubscribed ? 'Enabled' : 'Disabled'}
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
                    <p className="text-sm text-muted-foreground">
                        Push notifications are blocked. Please enable them in your browser settings.
                    </p>
                </CardContent>
            )}
        </Card>
    )
}
