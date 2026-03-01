"use client";

import { useState, useEffect } from "react";

export type GoogleEvent = {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    htmlLink: string;
};

export function useGoogleCalendar(currentMonth: Date) {
    const [events, setEvents] = useState<GoogleEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            try {
                const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

                const res = await fetch(`/api/calendar/events?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch Google Calendar events");
                }
                const data = await res.json();
                setEvents(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [currentMonth]);

    return { events, loading, error };
}
