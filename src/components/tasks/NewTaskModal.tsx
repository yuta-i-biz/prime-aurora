"use client";

import { useState } from "react";
import { createTask } from "@/app/actions/tasks";
import styles from "./NewTaskModal.module.css";
import { X } from "lucide-react";

export default function NewTaskModal({
    onClose,
    parentId = null,
    level = 1
}: {
    onClose: () => void;
    parentId?: string | null;
    level?: number;
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [syncToCalendar, setSyncToCalendar] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await createTask({
                title,
                description,
                level,
                parentId: parentId || undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                syncToCalendar,
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to create task");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h3>新規タスク作成 {level > 1 ? `(レベル ${level})` : ""}</h3>
                    <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>タスク名</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="何を完了させる必要がありますか？"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label>詳細 (任意)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="詳細な説明を追加..."
                            rows={3}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>期限</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>

                    {dueDate && (
                        <div className={`${styles.field} ${styles.checkboxField}`}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={syncToCalendar}
                                    onChange={e => setSyncToCalendar(e.target.checked)}
                                />
                                Google カレンダーにも予定を追加する
                            </label>
                        </div>
                    )}

                    <footer className={styles.footer}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            キャンセル
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? "作成中..." : "タスクを作成"}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
