import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultOrganizationId } from "@/app/actions/tasks";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { organizationId } = await getDefaultOrganizationId();
        const body = await request.json();
        const { title, description, googleEventId, dueDate } = body;

        if (!title || !googleEventId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if event is already imported to prevent duplicates
        const existing = await prisma.task.findFirst({
            where: {
                organizationId,
                googleEventId
            }
        });

        if (existing) {
            return NextResponse.json({ error: "Event already imported" }, { status: 400 });
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                googleEventId,
                status: "TODO",
                level: 1, // Default to level 1
                organizationId,
                assigneeId: session.user.id,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        revalidatePath("/tasks");
        revalidatePath("/");

        return NextResponse.json(task);
    } catch (error: any) {
        console.error("Failed to import calendar event as task:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
