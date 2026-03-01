"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useGoogleCalendar, GoogleEvent } from "@/hooks/useGoogleCalendar";
import EditEventModal from "@/components/calendar/EditEventModal";
import { startOfWeek, addDays, isSameDay, format, startOfMonth, endOfMonth, getDay, getDaysInMonth } from "date-fns";

type Task = {
    id: string;
    title: string;
    level: number;
    dueDate: Date | null;
    status: string;
};

export default function CalendarClient({ initialTasks }: { initialTasks: Task[] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [selectedEvent, setSelectedEvent] = useState<GoogleEvent | null>(null);
    const { events: googleEvents, loading: isGoogleLoading, error: googleError, syncNow } = useGoogleCalendar(currentDate);

    const days = ['日', '月', '火', '水', '木', '金', '土'];

    // Very simplistic calendar generation for demonstration
    // Real app would use date-fns to get actual month grid
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getDay(startOfMonth(currentDate));

    const dates = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        dates.push({ date: 0, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        dates.push({ date: i, isCurrentMonth: true });
    }
    while (dates.length % 7 !== 0) {
        dates.push({ date: 0, isCurrentMonth: false });
    }

    const prevDateRange = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(addDays(currentDate, -7));
        } else {
            setCurrentDate(addDays(currentDate, -1));
        }
    };

    const nextDateRange = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        } else if (viewMode === 'week') {
            setCurrentDate(addDays(currentDate, 7));
        } else {
            setCurrentDate(addDays(currentDate, 1));
        }
    };

    const displayDateRange = () => {
        if (viewMode === 'month') return format(currentDate, 'yyyy年 M月');
        if (viewMode === 'day') return format(currentDate, 'yyyy年 M月 d日');

        const weekStart = startOfWeek(currentDate);
        const weekEnd = addDays(weekStart, 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
            return `${format(weekStart, 'yyyy年 M月 d日')} - ${format(weekEnd, 'd日')}`;
        }
        return `${format(weekStart, 'yyyy年 M月 d日')} - ${format(weekEnd, 'M月 d日')}`;
    };

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

    const getTasksForDateObject = (targetDate: Date) => {
        const dateStr = targetDate.toDateString();
        return {
            tasks: groupedTasks[dateStr] || [],
            gcalEvents: groupedGcalEvents[dateStr] || []
        };
    };

    const handleSaveEvent = async (id: string, updatedData: any) => {
        const res = await fetch(`/api/calendar/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        if (res.ok) {
            syncNow();
        } else {
            throw new Error("Failed to update");
        }
    };

    const handleDeleteEvent = async (id: string) => {
        const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
        if (res.ok) {
            syncNow();
        } else {
            throw new Error("Failed to delete");
        }
    };

    return (
        <div className={styles.calendarPage}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.title}>カレンダー</h2>
                    <div className={styles.monthSelector}>
                        <button className={styles.iconButton} onClick={prevDateRange}>
                            <ChevronLeft className={styles.icon} />
                        </button>
                        <span className={styles.currentMonth}>{displayDateRange()}</span>
                        <button className={styles.iconButton} onClick={nextDateRange}>
                            <ChevronRight className={styles.icon} />
                        </button>
                    </div>
                </div>
                <div className={styles.viewToggles}>
                    {isGoogleLoading && <span className={styles.loadingText}>同期中...</span>}
                    {googleError && <span className={styles.errorText} title={googleError}>同期エラー</span>}
                    <button className={styles.refreshBtn} onClick={syncNow} disabled={isGoogleLoading}>
                        🔄 同期
                    </button>
                    <button className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.active : ''}`} onClick={() => setViewMode('month')}>月</button>
                    <button className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.active : ''}`} onClick={() => setViewMode('week')}>週</button>
                    <button className={`${styles.toggleBtn} ${viewMode === 'day' ? styles.active : ''}`} onClick={() => setViewMode('day')}>日</button>
                </div>
            </header>

            <div className={styles.calendarContainer}>
                {/* --- MONTH VIEW --- */}
                {viewMode === 'month' && (
                    <>
                        <div className={styles.daysHeader}>
                            {days.map(day => (
                                <div key={day} className={styles.dayName}>{day}</div>
                            ))}
                        </div>
                        <div className={styles.calendarGrid}>
                            {dates.map((d, i) => {
                                const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d.date);
                                const { tasks: tasksOnDate, gcalEvents: gcalEventsOnDate } = d.date > 0 ? getTasksForDateObject(targetDate) : { tasks: [], gcalEvents: [] };
                                const isToday = d.date > 0 && isSameDay(targetDate, new Date());

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
                                                    idx < 3 && <div key={t.id} className={`${styles.taskDot} ${t.status === 'DONE' ? styles.green : styles.blue}`} />
                                                ))}
                                            </div>
                                        )}

                                        {gcalEventsOnDate.slice(0, 3).map((ev: GoogleEvent) => (
                                            <div key={ev.id} className={`${styles.taskPreview} ${styles.googleEventPreview} ${styles.clickable}`} onClick={() => setSelectedEvent(ev)}>
                                                <CalendarIcon className={styles.googleIconSmall} />
                                                <span className={styles.taskPreviewTitle}>{ev.summary}</span>
                                            </div>
                                        ))}

                                        {tasksOnDate.slice(0, 2).map(t => (
                                            <div key={t.id} className={`${styles.taskPreview} ${t.status === 'DONE' ? styles.taskPreviewDone : ''}`}>
                                                <span className={styles.taskPreviewTitle}>{t.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* --- WEEK VIEW (Simple columns) --- */}
                {viewMode === 'week' && (
                    <div className={styles.weekGridWrapper}>
                        <div className={styles.weekGrid}>
                            {Array.from({ length: 7 }).map((_, i) => {
                                const date = addDays(startOfWeek(currentDate), i);
                                const { tasks, gcalEvents } = getTasksForDateObject(date);
                                const isToday = isSameDay(date, new Date());

                                return (
                                    <div key={i} className={`${styles.weekColumn} ${isToday ? styles.todayCol : ''}`}>
                                        <div className={styles.weekColumnHeader}>
                                            <div className={styles.weekDayName}>{days[i]}</div>
                                            <div className={`${styles.weekDateNum} ${isToday ? styles.todayNum : ''}`}>{date.getDate()}</div>
                                        </div>
                                        <div className={styles.weekEvents}>
                                            {gcalEvents.map((ev: GoogleEvent) => (
                                                <div key={ev.id} className={`${styles.detailedEventCard} ${styles.clickable}`} onClick={() => setSelectedEvent(ev)}>
                                                    <div className={styles.eventTime}>{ev.start.dateTime ? format(new Date(ev.start.dateTime), 'HH:mm') : '終日'}</div>
                                                    <div className={styles.eventTitle}>{ev.summary}</div>
                                                </div>
                                            ))}
                                            {tasks.map(t => (
                                                <div key={t.id} className={`${styles.detailedTaskCard} ${t.status === 'DONE' ? styles.detailedTaskDone : ''}`}>
                                                    <div className={styles.eventTitle}>{t.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- DAY VIEW (List) --- */}
                {viewMode === 'day' && (() => {
                    const { tasks, gcalEvents } = getTasksForDateObject(currentDate);
                    return (
                        <div className={styles.dayView}>
                            <h3 className={styles.dayViewTitle}>{format(currentDate, 'yyyy年 M月 d日')} の予定</h3>
                            <div className={styles.dayList}>
                                {gcalEvents.length === 0 && tasks.length === 0 && (
                                    <div className={styles.emptyDay}>予定はありません</div>
                                )}

                                {gcalEvents.map((ev: GoogleEvent) => (
                                    <div key={ev.id} className={`${styles.dayListItem} ${styles.googleListItem} ${styles.clickable}`} onClick={() => setSelectedEvent(ev)}>
                                        <Clock size={16} className={styles.listIcon} />
                                        <div className={styles.listTime}>{ev.start.dateTime ? format(new Date(ev.start.dateTime), 'HH:mm') : '終日'}</div>
                                        <div className={styles.listContent}>
                                            <div className={styles.listTitle}>{ev.summary}</div>
                                            {ev.description && <div className={styles.listDesc}>{ev.description}</div>}
                                        </div>
                                    </div>
                                ))}

                                {tasks.map(t => (
                                    <div key={t.id} className={`${styles.dayListItem} ${styles.auraListItem}`}>
                                        <div className={`${styles.listStatusDot} ${t.status === 'DONE' ? styles.green : ''}`} />
                                        <div className={styles.listContent}>
                                            <div className={`${styles.listTitle} ${t.status === 'DONE' ? styles.doneText : ''}`}>{t.title}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onSave={handleSaveEvent}
                    onDelete={handleDeleteEvent}
                />
            )}
        </div >
    );
}
