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

    // Initialize and register service worker
    const registerServiceWorker = useCallback(async () => {
        try {
            // Check if already registered
            let registration = await navigator.serviceWorker.getRegistration('/sw.js')

            if (!registration) {
                console.log('[Push] Registering service worker...')
                registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                })
                console.log('[Push] Service worker registered')
            }

            // Wait for it to be ready
            await navigator.serviceWorker.ready
            return registration
        } catch (err) {
            console.error('[Push] Service worker registration failed:', err)
            throw err
        }
    }, [])

    // Check if user is already subscribed
    const checkSubscription = useCallback(async () => {
        try {
            const registration = await registerServiceWorker()
            const subscription = await registration.pushManager.getSubscription()
            const subscribed = !!subscription
            setIsSubscribed(subscribed)
            console.log('[Push] Subscription status:', subscribed)
            return subscribed
        } catch (err) {
            console.error('[Push] Error checking subscription:', err)
            setIsSubscribed(false)
            return false
        }
    }, [registerServiceWorker])

    // Check if push notifications are supported (CLIENT-SIDE ONLY)
    useEffect(() => {
        // Only run in browser
        if (typeof window === 'undefined') return

        const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
        setIsSupported(supported)

        if (supported) {
            setPermission(Notification.permission)
            // Check subscription on mount
            checkSubscription()
        }
    }, [checkSubscription])

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

            if (result === 'granted') {
                console.log('[Push] Permission granted')
                return true
            } else {
                console.log('[Push] Permission denied')
                setError('Notification permission denied')
                return false
            }
        } catch (err: any) {
            console.error('[Push] Permission request error:', err)
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

            console.log('[Push] Starting subscription process...')

            // Step 1: Request permission if not already granted
            if (Notification.permission !== 'granted') {
                console.log('[Push] Requesting permission...')
                const permitted = await requestPermission()
                if (!permitted) {
                    setError('Permission denied')
                    return false
                }
            }

            // Step 2: Register service worker
            console.log('[Push] Registering service worker...')
            const registration = await registerServiceWorker()

            // Step 3: Check if already subscribed
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
                console.log('[Push] Already subscribed')
                setIsSubscribed(true)
                return true
            }

            // Step 4: Get VAPID public key
            const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!publicKey) {
                setError('Push notifications are not configured')
                console.error('[Push] VAPID public key not found')
                return false
            }

            console.log('[Push] Creating push subscription...')

            // Step 5: Subscribe to push manager
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            })

            console.log('[Push] Subscription created:', subscription.endpoint)

            // Step 6: Send subscription to server
            console.log('[Push] Saving subscription to server...')
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription.toJSON()),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                throw new Error(errorData.error || 'Failed to save subscription')
            }

            console.log('[Push] Subscription saved successfully')
            setIsSubscribed(true)

            return true
        } catch (err: any) {
            console.error('[Push] Subscribe error:', err)
            setError(err.message || 'Failed to subscribe')
            setIsSubscribed(false)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [isSupported, requestPermission, registerServiceWorker])

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true)
            setError(null)

            console.log('[Push] Unsubscribing...')

            const registration = await registerServiceWorker()
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                const endpoint = subscription.endpoint

                // Unsubscribe from push manager
                await subscription.unsubscribe()
                console.log('[Push] Unsubscribed from browser')

                // Remove from server
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ endpoint }),
                })

                console.log('[Push] Removed from server')
            }

            setIsSubscribed(false)
            return true
        } catch (err: any) {
            console.error('[Push] Unsubscribe error:', err)
            setError(err.message || 'Failed to unsubscribe')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [registerServiceWorker])

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
