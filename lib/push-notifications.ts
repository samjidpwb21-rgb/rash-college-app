"use server"

// ============================================================================
// WEB PUSH NOTIFICATION UTILITIES
// ============================================================================ 
// Server-side utilities for sending push notifications via Web Push API

import webpush from 'web-push'
import { prisma } from '@/lib/db'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVAPIDDetails(
        'mailto:admin@rash-college.edu', // Contact email
        vapidPublicKey,
        vapidPrivateKey
    )
}

/**
 * Send push notification to a specific user
 * @param userId - User ID to send notification to
 * @param notification - Notification data (title, message, link, type)
 */
export async function sendPushToUser(
    userId: string,
    notification: {
        title: string
        message: string
        link?: string
        type?: string
        id?: string
    }
) {
    try {
        // Check if VAPID keys are configured
        if (!vapidPublicKey || !vapidPrivateKey) {
            console.warn('[Push] VAPID keys not configured, skipping push notification')
            return { sent: 0, failed: 0 }
        }

        // Get all push subscriptions for this user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        })

        if (subscriptions.length === 0) {
            console.log(`[Push] No subscriptions found for user ${userId}`)
            return { sent: 0, failed: 0 }
        }

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.message,
            message: notification.message,
            link: notification.link || '/',
            type: notification.type || 'SYSTEM',
            id: notification.id,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
        })

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth,
                            },
                        },
                        payload
                    )
                    return { success: true, subscriptionId: sub.id }
                } catch (error: any) {
                    console.error(`[Push] Failed to send to subscription ${sub.id}:`, error)

                    // If subscription is expired or invalid, delete it
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log(`[Push] Removing invalid subscription ${sub.id}`)
                        await prisma.pushSubscription.delete({
                            where: { id: sub.id },
                        }).catch(console.error)
                    }

                    return { success: false, subscriptionId: sub.id, error: error.message }
                }
            })
        )

        const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
        const failed = results.length - sent

        console.log(`[Push] Sent ${sent}/${results.length} push notifications to user ${userId}`)

        return { sent, failed }
    } catch (error) {
        console.error('[Push] Error sending push notifications:', error)
        return { sent: 0, failed: 0 }
    }
}

/**
 * Send push notification to multiple users
 * @param userIds - Array of user IDs
 * @param notification - Notification data
 */
export async function sendPushToUsers(
    userIds: string[],
    notification: {
        title: string
        message: string
        link?: string
        type?: string
    }
) {
    const results = await Promise.all(
        userIds.map(userId => sendPushToUser(userId, notification))
    )

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)

    return { sent: totalSent, failed: totalFailed }
}

/**
 * Test if push notifications are configured
 */
export async function isPushConfigured(): Promise<boolean> {
    return !!(vapidPublicKey && vapidPrivateKey)
}
