import { prisma } from './prisma';
import { listGoogleCalendarEvents } from './google-calendar';

/**
 * Sync events from Google Calendar to our local DB cache.
 * Uses a fixed window (e.g., -1 month to +2 months) to keep the DB populated.
 */
export async function syncEventsToDbCache(userId: string) {
    try {
        const timeMin = new Date(new Date().setMonth(new Date().getMonth() - 1));
        const timeMax = new Date(new Date().setMonth(new Date().getMonth() + 2));

        // 1. Fetch fresh events from Google
        const freshEvents = await listGoogleCalendarEvents(userId, timeMin, timeMax);

        // 2. Clear out old cached events for this specific large window to avoid orphans
        // (If an event was deleted on Google, we don't get a 'deleted' event back easily without sync tokens, 
        // so we wipe and rewrite the window).
        await prisma.cachedEvent.deleteMany({
            where: {
                userId: userId,
                startTime: { gte: timeMin },
                endTime: { lte: timeMax }
            }
        });

        // 3. Insert new events
        const eventsToInsert = freshEvents.map(event => {
            const isAllDay = !!event.start?.date;

            // Handle missing dates defensively
            let startTime = new Date();
            let endTime = new Date();

            if (isAllDay) {
                startTime = new Date(event.start?.date as string);
                endTime = new Date(event.end?.date as string);
            } else {
                startTime = new Date(event.start?.dateTime as string);
                endTime = new Date(event.end?.dateTime as string);
            }

            return {
                userId,
                eventId: event.id as string,
                title: event.summary || 'No Title',
                description: event.description || null,
                startTime,
                endTime,
                allDay: isAllDay
            };
        });

        if (eventsToInsert.length > 0) {
            await prisma.cachedEvent.createMany({
                data: eventsToInsert,
                // In SQLite, skipDuplicates works but we also deleted them anyway
                skipDuplicates: true
            });
        }

        console.log(`Synced ${eventsToInsert.length} events to cache for user ${userId}.`);
        return true;
    } catch (error) {
        console.error("Failed to sync calendar events to DB cache:", error);
        return false;
    }
}
