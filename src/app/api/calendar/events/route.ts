import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    listGoogleCalendarEvents,
    createGoogleCalendarEvent,
    updateGoogleCalendarEvent,
    deleteGoogleCalendarEvent,
} from "@/lib/google-calendar";

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

        const events = await listGoogleCalendarEvents(
            session.user.id,
            timeMin,
            timeMax
        );

        return NextResponse.json(events);
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
