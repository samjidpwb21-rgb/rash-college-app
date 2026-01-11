// ============================================================================
// API ROUTE: SUBSCRIBE TO PUSH NOTIFICATIONS
// ============================================================================
// Saves a user's push subscription to the database

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const subscription = await request.json()

        // Validate subscription object
        if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
            return NextResponse.json(
                { error: 'Invalid subscription format' },
                { status: 400 }
            )
        }

        // Check if subscription already exists
        const existingSubscription = await prisma.pushSubscription.findUnique({
            where: { endpoint: subscription.endpoint },
        })

        if (existingSubscription) {
            // Update existing subscription
            await prisma.pushSubscription.update({
                where: { endpoint: subscription.endpoint },
                data: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            })
        } else {
            // Create new subscription
            await prisma.pushSubscription.create({
                data: {
                    userId: session.user.id,
                    endpoint: subscription.endpoint,
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Subscribe error:', error)
        return NextResponse.json(
            { error: 'Failed to save subscription' },
            { status: 500 }
        )
    }
}
