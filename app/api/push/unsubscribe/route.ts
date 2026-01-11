// ============================================================================
// API ROUTE: UNSUBSCRIBE FROM PUSH NOTIFICATIONS
// ============================================================================
// Removes a user's push subscription from the database

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

        const { endpoint } = await request.json()

        if (!endpoint) {
            return NextResponse.json(
                { error: 'Endpoint required' },
                { status: 400 }
            )
        }

        // Delete subscription
        await prisma.pushSubscription.deleteMany({
            where: {
                userId: session.user.id,
                endpoint,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Unsubscribe error:', error)
        return NextResponse.json(
            { error: 'Failed to remove subscription' },
            { status: 500 }
        )
    }
}
