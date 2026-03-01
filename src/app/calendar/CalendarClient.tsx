"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useGoogleCalendar, GoogleEvent } from "@/hooks/useGoogleCalendar";

type Task = {
    id: string;
    title: string;
    level: number;
    dueDate: Date | null;
    status: string;
};

export default function CalendarClient({ initialTasks }: { initialTasks: Task[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { events: googleEvents, loading: isGoogleLoading, error: googleError } = useGoogleCalendar(currentDate);

    const days = ['日', '月', '火', '水', '木', '金', '土'];

    // Very simplistic calendar generation for demonstration
    // Real app would use date-fns to get actual month grid
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const dates = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        dates.push({ date: 0, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        dates.push({ date: i, isCurrentMonth: true });
    }
    // Fill the rest of the grid
    while (dates.length % 7 !== 0) {
        dates.push({ date: 0, isCurrentMonth: false });
    }

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Pre-group tasks and events by date string to avoid O(N*M) loop and repeated Date formatting
    const groupedTasks: Record<string, Task[]> = {};
    initialTasks.forEach(t => {
        if (!t.dueDate) return;
        const dateStr = new Date(t.dueDate).toDateString();
        if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
        groupedTasks[dateStr].push(t);
    });

    const groupedGcalEvents: Record<string, GoogleEvent[]> = {};
    googleEvents.forEach((ev: GoogleEvent) => {
        const startStr = ev.start.dateTime || ev.start.date;
        if (!startStr) return;
        const dateStr = new Date(startStr).toDateString();
        if (!groupedGcalEvents[dateStr]) groupedGcalEvents[dateStr] = [];
        groupedGcalEvents[dateStr].push(ev);
    });

    const getTasksForDate = (day: number) => {
        if (day === 0) return { tasks: [], gcalEvents: [] };
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = targetDate.toDateString();

        return {
            tasks: groupedTasks[dateStr] || [],
            gcalEvents: groupedGcalEvents[dateStr] || []
        };
    };

    return (
        <div className={styles.calendarPage}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>カレンダー</h2>
                    <div className={styles.monthSelector}>
                        <button className={styles.iconButton} onClick={prevMonth}>
                            <ChevronLeft className={styles.icon} />
                        </button>
                        <span className={styles.currentMonth}>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</span>
                        <button className={styles.iconButton} onClick={nextMonth}>
                            <ChevronRight className={styles.icon} />
                        </button>
                    </div>
                </div>
                <div className={styles.viewToggles}>
                    {isGoogleLoading && <span className={styles.loadingText}>同期中...</span>}
                    {googleError && <span className={styles.errorText} title={googleError}>同期エラー</span>}
                    <button className={`${styles.toggleBtn} ${styles.active}`}>月</button>
                    <button className={styles.toggleBtn}>週</button>
                    <button className={styles.toggleBtn}>日</button>
                </div>
            </header>

            <div className={styles.calendarContainer}>
                <div className={styles.daysHeader}>
                    {days.map(day => (
                        <div key={day} className={styles.dayName}>{day}</div>
                    ))}
                </div>
                <div className={styles.calendarGrid}>
                    {dates.map((d, i) => {
                        const { tasks: tasksOnDate, gcalEvents: gcalEventsOnDate } = getTasksForDate(d.date);
                        const isToday = d.date === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();

                        const totalEventsOnDate = tasksOnDate.length + gcalEventsOnDate.length;

                        return (
                            <div
                                key={i}
                                className={`${styles.calendarCell} ${!d.isCurrentMonth ? styles.otherMonth : ''} ${isToday ? styles.today : ''}`}
                            >
                                {d.date > 0 && <span className={styles.dateNumber}>{d.date}</span>}

                                {totalEventsOnDate > 0 && (
                                    <div className={styles.taskIndicators}>
                                        {tasksOnDate.map((t, idx) => (
                                            idx < 3 ? (
                                                <div key={t.id} className={`${styles.taskDot} ${t.status === 'DONE' ? styles.green : styles.blue}`} />
                                            ) : null
                                        ))}
                                    </div>
                                )}

                                {/* Render Google Events First */}
                                {gcalEventsOnDate.slice(0, 2).map((ev: GoogleEvent) => (
                                    <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" key={ev.id} style={{ textDecoration: 'none' }}>
                                        <div className={`${styles.taskPreview} ${styles.googleEventPreview}`}>
                                            <CalendarIcon className={styles.googleIconSmall} />
                                            <span className={styles.taskPreviewTitle}>{ev.summary}</span>
                                        </div>
                                    </a>
                                ))}

                                {/* Render Aura Tasks */}
                                {tasksOnDate.slice(0, 2).map(t => (
                                    <div key={t.id} className={`${styles.taskPreview} ${t.status === 'DONE' ? styles.taskPreviewDone : ''}`}>
                                        <span className={styles.taskPreviewTitle}>{t.title}</span>
                                    </div>
                                ))}

                                {totalEventsOnDate > 4 && (
                                    <span className={styles.moreTasks}>他 {totalEventsOnDate - 4} 件</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
