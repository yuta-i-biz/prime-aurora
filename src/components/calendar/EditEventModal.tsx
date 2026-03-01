"use client";

import { useState } from "react";
import styles from "./EditEventModal.module.css";
import { X, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

type EditEventModalProps = {
    event: {
        id: string;
        summary: string;
        description?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
        htmlLink: string;
    };
    onClose: () => void;
    onSave: (id: string, updatedEvent: any) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
};

export default function EditEventModal({ event, onClose, onSave, onDelete }: EditEventModalProps) {
    const isInitiallyAllDay = !!event.start.date;

    const initialStart = isInitiallyAllDay
        ? event.start.date
        : event.start.dateTime ? format(parseISO(event.start.dateTime), "yyyy-MM-dd'T'HH:mm") : "";

    const initialEnd = isInitiallyAllDay
        ? event.end.date
        : event.end.dateTime ? format(parseISO(event.end.dateTime), "yyyy-MM-dd'T'HH:mm") : "";


    const [title, setTitle] = useState(event.summary);
    const [description, setDescription] = useState(event.description || "");
    const [isAllDay, setIsAllDay] = useState(isInitiallyAllDay);
    const [start, setStart] = useState(initialStart);
    const [end, setEnd] = useState(initialEnd);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(event.id, {
                title,
                description,
                allDay: isAllDay,
                start,
                end
            });
            onClose();
        } catch (error) {
            console.error("Failed to save:", error);
            alert("予定の更新に失敗しました。");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("本当にこの予定を削除しますか？Googleカレンダーからも削除されます。")) return;

        setIsDeleting(true);
        try {
            await onDelete(event.id);
            onClose();
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("予定の削除に失敗しました。");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <header className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>予定の編集</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>タイトル</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroupRow}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={isAllDay}
                                onChange={(e) => setIsAllDay(e.target.checked)}
                            />
                            終日
                        </label>
                    </div>

                    <div className={styles.formGroupRowTime}>
                        <div className={styles.formGroup}>
                            <label>開始</label>
                            <input
                                type={isAllDay ? "date" : "datetime-local"}
                                className={styles.input}
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                            />
                        </div>
                        <span className={styles.timeSeparator}>〜</span>
                        <div className={styles.formGroup}>
                            <label>終了</label>
                            <input
                                type={isAllDay ? "date" : "datetime-local"}
                                className={styles.input}
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>説明・メモ</label>
                        <textarea
                            className={styles.textarea}
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.googleLinkRow}>
                        <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className={styles.googleLink}>
                            Googleカレンダーで開く
                        </a>
                    </div>
                </div>

                <footer className={styles.modalFooter}>
                    <button
                        className={styles.deleteBtn}
                        onClick={handleDelete}
                        disabled={isSaving || isDeleting}
                    >
                        {isDeleting ? "削除中..." : <><Trash2 size={16} /> 削除</>}
                    </button>
                    <div className={styles.footerRight}>
                        <button className={styles.cancelBtn} onClick={onClose} disabled={isSaving || isDeleting}>キャンセル</button>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving || isDeleting || !title}>
                            {isSaving ? "保存中..." : "保存"}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
