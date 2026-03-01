"use client";

import { useEffect, useRef } from "react";
import { getTasks } from "@/app/actions/tasks";
import { useSession } from "next-auth/react";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const notifiedTasksRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!session?.user) return;

        const checkOverdueReflections = async () => {
            try {
                const tasks = await getTasks();
                const now = new Date();

                const overdueTasks = tasks.filter(task => {
                    if (!task.dueDate) return false;
                    const due = new Date(task.dueDate);
                    // Check if due date is passed
                    if (due >= now) return false;
                    // Check if reflection is empty
                    if (task.reflection && task.reflection.trim().length > 0) return false;
                    // Check if we already notified for this task in this session
                    if (notifiedTasksRef.current.has(task.id)) return false;
                    return true;
                });

                if (overdueTasks.length > 0 && "Notification" in window) {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        overdueTasks.forEach(task => {
                            new Notification("Missing Reflection", {
                                body: `Task "${task.title}" is overdue and missing a reflection.`,
                                icon: "/favicon.ico",
                            });
                            notifiedTasksRef.current.add(task.id);
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to check notifications", err);
            }
        };

        // Check immediately and then every hour
        checkOverdueReflections();
        const interval = setInterval(checkOverdueReflections, 1000 * 60 * 60);

        return () => clearInterval(interval);
    }, [session]);

    return <>{children}</>;
}
