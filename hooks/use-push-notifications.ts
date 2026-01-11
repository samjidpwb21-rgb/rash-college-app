"use client"

// ============================================================================
// REACT HOOK: USE PUSH NOTIFICATIONS
// ============================================================================
// Client-side hook for managing Web Push API permissions and subscriptions

import { useState, useEffect, useCallback } from 'react'

interface UsePushNotificationsReturn {
    isSupported: boolean
    permission: NotificationPermission | null
    isSubscribed: boolean
    isLoading: boolean
    error: string | null
    requestPermission: () => Promise<boolean>
    subscribe: () => Promise<boolean>
    unsubscribe: () => Promise<boolean>
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const [isSupported, setIsSupported] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission | null>(null)
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Check if push notifications are supported (CLIENT-SIDE ONLY)
    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return

        const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)

        if (supported) {
            setPermission(Notification.permission)

            // Check subscription after service worker is ready
            navigator.serviceWorker.ready.then(() => {
                checkSubscription()
            }).catch(() => {
                // Service worker not ready yet, try to register
                navigator.serviceWorker.register('/sw.js').then(() => {
                    checkSubscription()
                }).catch((err) => {
                    console.error('[Push Hook] Service worker registration failed:', err)
                })
            })
        }
    }, [])

    // Check if user is already subscribed
    const checkSubscription = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
            return !!subscription
        } catch (err) {
            console.error('[Push Hook] Error checking subscription:', err)
            setIsSubscribed(false)
            return false
        }
    }, [])

    // Request notification permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        // Only run in browser
        if (typeof window === 'undefined' || !isSupported) {
            setError('Push notifications are not supported in this browser')
            return false
        }

        try {
            setIsLoading(true)
            setError(null)

            const result = await Notification.requestPermission()
            setPermission(result)

            return result === 'granted'
        } catch (err: any) {
            setError(err.message || 'Failed to request permission')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isSupported])

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        // Only run in browser
        if (typeof window === 'undefined' || !isSupported) {
            setError('Push notifications are not supported')
            return false
        }

        try {
            setIsLoading(true)
            setError(null)

            // Request permission if not already granted
            if (Notification.permission !== 'granted') {
                const permitted = await requestPermission()
                if (!permitted) {
                    setError('Permission denied')
                    return false
                }
            }

            // Register service worker
            let registration = await navigator.serviceWorker.getRegistration()
            if (!registration) {
                console.log('[Push Hook] Registering service worker...')
                registration = await navigator.serviceWorker.register('/sw.js')
                // Wait for service worker to be ready
                await navigator.serviceWorker.ready
            }

            // Double-check if already subscribed
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
                console.log('[Push Hook] Already subscribed')
                setIsSubscribed(true)
                return true
            }

            // Get VAPID public key from environment
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!publicKey) {
                setError('Push notifications are not configured on the server')
                return false
            }

            console.log('[Push Hook] Creating push subscription...')

            // Subscribe to push manager
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            })

            console.log('[Push Hook] Subscription created, saving to server...')

            // Send subscription to server
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription.toJSON()),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to save subscription to server')
            }

            console.log('[Push Hook] Subscription saved successfully')
            setIsSubscribed(true)

            // Re-check subscription to ensure state is synced
            await checkSubscription()

            return true
        } catch (err: any) {
            console.error('[Push Hook] Subscribe error:', err)
            setError(err.message || 'Failed to subscribe')
            setIsSubscribed(false)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isSupported, requestPermission, checkSubscription])

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true)
            setError(null)

            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                console.log('[Push Hook] Unsubscribing from push notifications...')

                // Unsubscribe from push manager
                await subscription.unsubscribe()

                // Remove from server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                })

                console.log('[Push Hook] Unsubscribed successfully')
            }

            setIsSubscribed(false)

            // Re-check subscription to ensure state is synced
            await checkSubscription()

            return true
        } catch (err: any) {
            console.error('[Push Hook] Unsubscribe error:', err)
            setError(err.message || 'Failed to unsubscribe')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [checkSubscription])

    return {
        isSupported,
        permission,
        isSubscribed,
        isLoading,
        error,
        requestPermission,
        subscribe,
        unsubscribe,
    }
}

// Helper function to convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
