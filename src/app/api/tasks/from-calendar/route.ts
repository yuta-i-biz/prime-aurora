import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultOrganizationId } from "@/app/actions/tasks";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { organizationId } = await getDefaultOrganizationId();

        // 1. Get all CachedEvents for this user from today onwards
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cachedEvents = await prisma.cachedEvent.findMany({
            where: {
                userId: session.user.id,
                startTime: { gte: today }
            },
            orderBy: { startTime: 'asc' }
        });

        // 2. Get all existing Tasks in the organization that have a googleEventId
        const existingTasks = await prisma.task.findMany({
            where: {
                organizationId,
                googleEventId: { not: null }
            },
            select: { googleEventId: true }
        });

        // Create a Set of used Event IDs for fast lookup
        const usedEventIds = new Set(existingTasks.map(t => t.googleEventId));

        // 3. Filter out CachedEvents that are already Tasks
        const unassignedEvents = cachedEvents.filter(ev => !usedEventIds.has(ev.eventId));

        // Format for frontend
        const mappedForFrontend = unassignedEvents.map(dbEvent => ({
            id: dbEvent.eventId,
            title: dbEvent.title,
            description: dbEvent.description,
            start: dbEvent.startTime,
            end: dbEvent.endTime,
            allDay: dbEvent.allDay
        }));

        return NextResponse.json(mappedForFrontend);
    } catch (error: any) {
        console.error("Failed to fetch unassigned calendar events:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
