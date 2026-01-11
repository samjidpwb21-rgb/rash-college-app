// ============================================================================
// CRON JOB: EVENT REMINDERS
// ============================================================================
// Sends push notifications for events happening tomorrow
// Runs daily at 9:00 AM via Vercel Cron

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushToUser } from '@/lib/push-notifications'

export const runtime = "nodejs"
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Find events happening tomorrow
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        const dayAfterTomorrow = new Date(tomorrow)
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

        const upcomingEvents = await prisma.event.findMany({
            where: {
                eventDate: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow,
                },
            },
        })

        if (upcomingEvents.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No events tomorrow',
                sent: 0,
            })
        }

        // Get all active users
        const users = await prisma.user.findMany({
            where: {
                isActive: true,
                deletedAt: null,
            },
            select: { id: true },
        })

        let totalSent = 0

        // Send notification for each event
        for (const event of upcomingEvents) {
            const eventDate = event.eventDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            })

            // Create in-app notifications for all users
            await prisma.notification.createMany({
                data: users.map((user) => ({
                    userId: user.id,
                    type: 'EVENT',
                    title: 'Upcoming Event Reminder',
                    message: `"${event.title}" is scheduled for tomorrow (${eventDate})`,
                    link: '/dashboard/events',
                })),
            })

            // Send push notifications
            await Promise.all(
                users.map(async (user) => {
                    await sendPushToUser(user.id, {
                        title: 'Event Tomorrow',
                        message: `${event.title} - ${eventDate}`,
                        link: '/dashboard/events',
                        type: 'EVENT',
                    })
                    totalSent++
                })
            )
        }

        console.log(`[Cron] Sent ${totalSent} event reminders for ${upcomingEvents.length} events`)

        return NextResponse.json({
            success: true,
            events: upcomingEvents.length,
            sent: totalSent,
        })
    } catch (error) {
        console.error('[Cron] Event reminders error:', error)
        return NextResponse.json(
            { error: 'Failed to send event reminders' },
            { status: 500 }
        )
    }
}
