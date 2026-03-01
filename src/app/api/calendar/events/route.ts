import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    listGoogleCalendarEvents,
    createGoogleCalendarEvent,
    updateGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
} from "@/lib/google-calendar";

import { syncEventsToDbCache } from "@/lib/sync-calendar";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startStr = searchParams.get("start");
        const endStr = searchParams.get("end");

        const timeMin = startStr
            ? new Date(startStr)
            : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const timeMax = endStr
            ? new Date(endStr)
            : new Date(new Date().setMonth(new Date().getMonth() + 2));

        // 1. Instantly return locally cached events (Fast path)
        const cachedEvents = await prisma.cachedEvent.findMany({
            where: {
                userId: session.user.id,
                startTime: { gte: timeMin },
                endTime: { lte: timeMax }
            },
            orderBy: { startTime: 'asc' }
        });

        // 2. Trigger background sync without awaiting its finish (Stale-While-Revalidate pattern)
        // Note: In Next.js App Router, floating promises in Route Handlers can be canceled by Vercel if the response returns. 
        // For absolute consistency, we use `waitUntil` if available, or just standard async execution for local dev
        Promise.resolve(syncEventsToDbCache(session.user.id)).catch(console.error);

        // Convert db row formats back to the format the frontend expects temporarily to minimize refactor:
        const mappedForFrontend = cachedEvents.map(dbEvent => ({
            id: dbEvent.eventId,
            summary: dbEvent.title,
            description: dbEvent.description,
            start: dbEvent.allDay ? { date: dbEvent.startTime.toISOString().split('T')[0] } : { dateTime: dbEvent.startTime.toISOString() },
            end: dbEvent.allDay ? { date: dbEvent.endTime.toISOString().split('T')[0] } : { dateTime: dbEvent.endTime.toISOString() },
        }));

        return NextResponse.json(mappedForFrontend);
    } catch (error: any) {
        console.error("Google Calendar GET Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const result = await createGoogleCalendarEvent(session.user.id, body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Google Calendar POST Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");
        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const result = await updateGoogleCalendarEvent(session.user.id, eventId, body);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Google Calendar PUT Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get("eventId");

        if (!eventId) {
            return NextResponse.json(
                { error: "Event ID is required" },
                { status: 400 }
            );
        }

        await deleteGoogleCalendarEvent(session.user.id, eventId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Google Calendar DELETE Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
