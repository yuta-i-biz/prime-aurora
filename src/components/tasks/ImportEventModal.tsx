"use client";

import { useState, useEffect } from "react";
import { X, Plus, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import styles from "./ImportEventModal.module.css";
import { createTask } from "@/app/actions/tasks";

type UnassignedEvent = {
    id: string;
    title: string;
    description: string | null;
    start: string;
    end: string;
    allDay: boolean;
};

export default function ImportEventModal({
    onClose,
    onSuccess
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [events, setEvents] = useState<UnassignedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [importingId, setImportingId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/tasks/from-calendar");
                if (!res.ok) throw new Error("取得に失敗しました");
                const data = await res.json();
                setEvents(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

    const handleImport = async (event: UnassignedEvent) => {
        setImportingId(event.id);
        try {
            // We use the same server action to create a task
            // and pass the event.id so it knows it came from Google Calendar
            await fetch('/api/tasks/from-calendar/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: event.title,
                    description: event.description,
                    googleEventId: event.id,
                    dueDate: event.allDay ? new Date(event.start) : new Date(event.start),
                })
            });

            // Remove from list
            setEvents(prev => prev.filter(e => e.id !== event.id));
            onSuccess(); // Trigger a refresh in the parent TaskList
        } catch (err) {
            console.error(err);
            alert("取り込みに失敗しました");
        } finally {
            setImportingId(null);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <header className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>
                        <CalendarIcon size={20} className={styles.titleIcon} />
                        カレンダーから予定を取り込む
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </header>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loading}>予定を読み込んでいます...</div>
                    ) : error ? (
                        <div className={styles.error}>{error}</div>
                    ) : events.length === 0 ? (
                        <div className={styles.empty}>
                            取り込める予定はありません🎉<br />
                            (本日の新しい予定はすべてタスク化されています)
                        </div>
                    ) : (
                        <div className={styles.eventList}>
                            {events.map(ev => {
                                const startDate = new Date(ev.start);
                                return (
                                    <div key={ev.id} className={styles.eventItem}>
                                        <div className={styles.eventInfo}>
                                            <span className={styles.eventTitle}>{ev.title}</span>
                                            <span className={styles.eventTime}>
                                                <Clock size={14} />
                                                {format(startDate, 'M月d日 (E)', { locale: ja })}
                                                {!ev.allDay && ` ${format(startDate, 'HH:mm')}`}
                                            </span>
                                        </div>
                                        <button
                                            className={styles.importBtn}
                                            disabled={importingId === ev.id}
                                            onClick={() => handleImport(ev)}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
