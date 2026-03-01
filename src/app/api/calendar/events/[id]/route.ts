import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/google-calendar";
import { syncEventsToDbCache } from "@/lib/sync-calendar";
import { prisma } from "@/lib/prisma";

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventId = params.id;
        const body = await request.json();

        // 1. Update on Google Calendar
        const updatedEvent = await updateGoogleCalendarEvent(session.user.id, eventId, {
            summary: body.title,
            description: body.description,
            start: body.allDay ? { date: body.start } : { dateTime: body.start },
            end: body.allDay ? { date: body.end } : { dateTime: body.end },
        });

        // 2. Update local cache directly without full sync to feel fast
        const startTime = new Date(body.start);
        const endTime = new Date(body.end);

        await prisma.cachedEvent.update({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId: eventId
                }
            },
            data: {
                title: body.title,
                description: body.description || null,
                startTime,
                endTime,
                allDay: body.allDay || false
            }
        }).catch(e => {
            console.warn("Cached event didn't exist directly:", e)
        });

        return NextResponse.json({ success: true, event: updatedEvent });
    } catch (error: any) {
        console.error("Failed to update event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const eventId = params.id;

        // 1. Delete on Google
        await deleteGoogleCalendarEvent(session.user.id, eventId);

        // 2. Delete in local cache
        await prisma.cachedEvent.deleteMany({
            where: {
                userId: session.user.id,
                eventId: eventId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Failed to delete event:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
