import Link from 'next/link';
import { LayoutDashboard, Calendar, CheckSquare, Settings, Bell, Menu } from 'lucide-react';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            {/* Sidebar / Bottom Navigation */}
            <nav className={styles.navigation}>
                <div className={styles.brand}>
                    <div className={styles.logo}>A</div>
                    <span className={styles.brandName}>Aura Task</span>
                </div>

                <ul className={styles.navLinks}>
                    <li>
                        <Link href="/" className={`${styles.navItem} ${styles.active}`}>
                            <LayoutDashboard className={styles.icon} />
                            <span className={styles.label}>概要</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/tasks" className={styles.navItem}>
                            <CheckSquare className={styles.icon} />
                            <span className={styles.label}>タスク</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/calendar" className={styles.navItem}>
                            <Calendar className={styles.icon} />
                            <span className={styles.label}>カレンダー</span>
                        </Link>
                    </li>
                </ul>

                <div className={styles.navSpacer} />

                <ul className={styles.navLinks}>
                    <li>
                        <Link href="/settings" className={styles.navItem}>
                            <Settings className={styles.icon} />
                            <span className={styles.label}>設定</span>
                        </Link>
                    </li>
                </ul>
            </nav>

            <main className={styles.mainContent}>
                <header className={styles.header}>
                    <div className={styles.mobileMenu}>
                        <Menu className={styles.icon} />
                    </div>
                    <h1 className={styles.pageTitle}>ホーム</h1>
                    <div className={styles.actions}>
                        <button className={styles.iconButton}>
                            <Bell className={styles.icon} />
                        </button>
                        <div className={styles.avatar}>U</div>
                    </div>
                </header>

                <div className={styles.contentWrapper}>
                    {children}
                </div>
            </main>
        </div>
    );
}
