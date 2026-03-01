import styles from "./page.module.css";
import { CheckCircle2, Clock, CalendarIcon, AlertCircle } from "lucide-react";
import { getTasks } from "@/app/actions/tasks";
import { format } from "date-fns";
import Link from "next/link";

export default async function Home() {
  const tasks = await getTasks();

  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO').length;
  const todayTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString());
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length;

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.greeting}>こんにちは👋</h2>
          <p className={styles.subtitle}>本日のタスク状況です。</p>
        </div>
        <Link href="/tasks">
          <button className={styles.primaryButton}>+ タスク作成</button>
        </Link>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.blue}`}>
            <CheckCircle2 className={styles.icon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{completedTasks}</span>
            <span className={styles.statLabel}>完了済み</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.orange}`}>
            <Clock className={styles.icon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{inProgressTasks}</span>
            <span className={styles.statLabel}>進行中</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.purple}`}>
            <CalendarIcon className={styles.icon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{todayTasks.length}</span>
            <span className={styles.statLabel}>本日のタスク</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.iconWrapper} ${styles.red}`}>
            <AlertCircle className={styles.icon} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{overdueTasks}</span>
            <span className={styles.statLabel}>期限超過</span>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>本日の優先タスク</h3>
            <Link href="/tasks"><button className={styles.viewAll}>すべて見る</button></Link>
          </div>
          <div className={styles.taskList}>
            {todayTasks.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>本日のタスクはありません。</p>
            ) : (
              todayTasks.slice(0, 5).map((task) => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={`${styles.checkbox} ${task.status === 'DONE' ? styles.done : ''}`} />
                  <div className={styles.taskContent}>
                    <h4 className={styles.taskTitle}>{task.title}</h4>
                    <div className={styles.taskMeta}>
                      <span className={styles.badge}>Level {task.level}</span>
                      <span className={styles.time}>{task.dueDate ? format(new Date(task.dueDate), "MMM d") : ""}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>今週の生産性</h3>
          </div>
          <div className={styles.chartPlaceholder}>
            {/* Chart visualization will go here */}
            <div className={styles.bars}>
              <div className={styles.barLine} style={{ height: '60%' }}></div>
              <div className={styles.barLine} style={{ height: '80%' }}></div>
              <div className={styles.barLine} style={{ height: '40%' }}></div>
              <div className={styles.barLine} style={{ height: '100%', backgroundColor: 'var(--brand)' }}></div>
              <div className={styles.barLine} style={{ height: '30%' }}></div>
              <div className={styles.barLine} style={{ height: '70%' }}></div>
              <div className={styles.barLine} style={{ height: '50%' }}></div>
            </div>
            <div className={styles.days}>
              <span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span><span>日</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
