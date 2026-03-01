"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { Plus, Filter, SortDesc, ChevronRight, ChevronDown } from "lucide-react";
import NewTaskModal from "@/components/tasks/NewTaskModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import ImportEventModal from "@/components/tasks/ImportEventModal";
import { format } from "date-fns";

type Task = {
    id: string;
    title: string;
    level: number;
    parentId: string | null;
    dueDate: Date | null;
    status: string;
    description: string | null;
    reflection: string | null;
};

export default function TasksClient({ initialTasks }: { initialTasks: Task[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [addingLevel, setAddingLevel] = useState<number>(1);
    const [addingParentId, setAddingParentId] = useState<string | null>(null);

    const handleAddTask = (level: number, parentId: string | null = null) => {
        setAddingLevel(level);
        setAddingParentId(parentId);
        setIsModalOpen(true);
    };

    const level1Tasks = initialTasks.filter(t => t.level === 1);

    const getChildren = (parentId: string) =>
        initialTasks.filter(t => t.parentId === parentId);

    const renderTask = (task: Task) => {
        const children = getChildren(task.id);
        const hasChildren = children.length > 0;
        const canAddSubtask = task.level < 3;

        return (
            <div key={task.id} className={styles[`level${task.level}`]}>
                <div className={styles.taskRow} onClick={() => setEditingTask(task)}>
                    <div className={styles.expander} onClick={(e) => e.stopPropagation()}>
                        {hasChildren ? <ChevronDown className={styles.iconSm} /> : (canAddSubtask ? <div className={styles.dot} /> : null)}
                    </div>
                    <div className={`${styles.circle} ${task.status === 'DONE' ? styles.done : ''}`} />
                    <div className={styles.taskContent}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <div className={styles.taskMetaGroup}>
                            {task.dueDate && (
                                <span className={styles.dueDate}>
                                    {format(new Date(task.dueDate), "MMM d")}
                                </span>
                            )}
                            {canAddSubtask && (
                                <button
                                    className={styles.addSubtaskBtn}
                                    onClick={(e) => { e.stopPropagation(); handleAddTask(task.level + 1, task.id); }}
                                >
                                    <Plus size={14} /> サブタスク追加
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {hasChildren && (
                    <div className={styles.childrenContainer}>
                        {children.map(renderTask)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.tasksPage}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>すべてのタスク</h2>
                    <p className={styles.subtitle}>リスト形式で階層的にタスクを管理できます。</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.iconButton} onClick={() => setIsImportModalOpen(true)} title="カレンダーから予定を取り込む">
                        📅 取り込み
                    </button>
                    <button className={styles.iconButton}>
                        <Filter className={styles.icon} />
                    </button>
                    <button className={styles.iconButton}>
                        <SortDesc className={styles.icon} />
                    </button>
                    <button className={styles.primaryButton} onClick={() => handleAddTask(1)}>
                        <Plus className={styles.btnIcon} /> 新規タスク
                    </button>
                </div>
            </header>

            <div className={styles.taskListContainer}>
                {initialTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>タスクがありません。新しく作成して始めましょう！</p>
                    </div>
                ) : (
                    <div className={styles.taskTree}>
                        {level1Tasks.map(renderTask)}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <NewTaskModal
                    onClose={() => setIsModalOpen(false)}
                    level={addingLevel}
                    parentId={addingParentId}
                />
            )}

            {editingTask && (
                <EditTaskModal
                    task={editingTask as any}
                    onClose={() => setEditingTask(null)}
                />
            )}

            {isImportModalOpen && (
                <ImportEventModal
                    onClose={() => setIsImportModalOpen(false)}
                    onSuccess={() => {
                        setIsImportModalOpen(false);
                        window.location.reload(); // Quick refresh to show new tasks, Next.js revalidatePath handles server cache
                    }}
                />
            )}
        </div>
    );
}
