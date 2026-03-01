"use client";

import { useState } from "react";
import { updateTask, deleteTask } from "@/app/actions/tasks";
import styles from "./NewTaskModal.module.css";
import { X, Trash2 } from "lucide-react";

type TaskFull = {
    id: string;
    title: string;
    description: string | null;
    level: number;
    status: string;
    dueDate: Date | null;
    reflection: string | null;
};

export default function EditTaskModal({
    task,
    onClose,
}: {
    task: TaskFull;
    onClose: () => void;
}) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || "");
    const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    const [status, setStatus] = useState(task.status);
    const [reflection, setReflection] = useState(task.reflection || "");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            await updateTask(task.id, {
                title,
                description: description || undefined,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                status,
                reflection: reflection || undefined,
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to update task");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Are you sure you want to delete this task?")) return;
        setIsSubmitting(true);
        try {
            await deleteTask(task.id);
            onClose();
        } catch (err) {
            console.error(err);
            alert("Failed to delete task");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h3>タスクを編集</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={styles.closeBtn} onClick={handleDelete} title="タスクを削除" style={{ color: 'var(--error)' }}>
                            <Trash2 size={18} />
                        </button>
                        <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label>タスク名</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>ステータス</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className={styles.select}
                        >
                            <option value="TODO">To Do (未着手)</option>
                            <option value="IN_PROGRESS">進行中</option>
                            <option value="DONE">完了</option>
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label>期限</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>振り返り (期限超過の場合は必須)</label>
                        <textarea
                            value={reflection}
                            onChange={e => setReflection(e.target.value)}
                            placeholder="何がうまくいきましたか？ 改善できる点はありますか？"
                            rows={4}
                        />
                    </div>

                    <footer className={styles.footer}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>
                            キャンセル
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !title.trim()}>
                            {isSubmitting ? "保存中..." : "変更を保存"}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
