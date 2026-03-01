"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createGoogleCalendarEvent } from "@/lib/google-calendar";

// Ensure the user is authorized and get their default organization
export async function getDefaultOrganizationId() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: session.user.id },
        select: { organizationId: true },
    });

    if (!orgMember) throw new Error("No organization found");
    return { userId: session.user.id, organizationId: orgMember.organizationId };
}

export async function getTasks() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const tasks = await prisma.task.findMany({
        where: {
            organization: {
                members: {
                    some: { userId: session.user.id }
                }
            }
        },
        orderBy: { createdAt: "asc" },
    });

    return tasks;
}

export async function createTask(data: {
    title: string;
    description?: string;
    level: number;
    parentId?: string;
    dueDate?: Date;
    assigneeId?: string;
    syncToCalendar?: boolean;
}) {
    const { userId, organizationId } = await getDefaultOrganizationId();

    let googleEventId: string | undefined = undefined;

    if (data.syncToCalendar && data.dueDate) {
        try {
            // Assume 1 hour duration by default if no time specified, or just an all-day event
            // Let's create an all-day event for simplicity
            const dateStr = data.dueDate.toISOString().split('T')[0];
            const event = await createGoogleCalendarEvent(userId, {
                summary: `[Aura] ${data.title}`,
                description: data.description,
                start: { date: dateStr },
                end: { date: dateStr }, // All day events need end date to be the same or +1 day
            });
            if (event.id) {
                googleEventId = event.id;
            }
        } catch (err) {
            console.error("Failed to sync task to Google Calendar:", err);
            // Optionally throw or proceed without sync
        }
    }

    const task = await prisma.task.create({
        data: {
            title: data.title,
            description: data.description,
            level: data.level,
            parentId: data.parentId,
            dueDate: data.dueDate,
            assigneeId: data.assigneeId || userId,
            organizationId,
            googleEventId,
        },
    });

    revalidatePath("/tasks");
    revalidatePath("/");
    return task;
}

export async function updateTask(
    taskId: string,
    data: {
        title?: string;
        description?: string;
        status?: string;
        dueDate?: Date;
        reflection?: string;
    }
) {
    const { organizationId } = await getDefaultOrganizationId();

    // Verify the task belongs to the user's organization
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (existing?.organizationId !== organizationId) {
        throw new Error("Forbidden");
    }

    const task = await prisma.task.update({
        where: { id: taskId },
        data,
    });

    revalidatePath("/tasks");
    revalidatePath("/");
    return task;
}

export async function deleteTask(taskId: string) {
    const { organizationId } = await getDefaultOrganizationId();

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (existing?.organizationId !== organizationId) {
        throw new Error("Forbidden");
    }

    await prisma.task.delete({ where: { id: taskId } });

    revalidatePath("/tasks");
    revalidatePath("/");
    return { success: true };
}
