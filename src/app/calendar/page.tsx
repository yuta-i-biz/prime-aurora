import { getTasks } from "@/app/actions/tasks";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
    const tasks = await getTasks();
    return <CalendarClient initialTasks={tasks} />;
}
