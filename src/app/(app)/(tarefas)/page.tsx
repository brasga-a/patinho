import { HeaderMenu } from "@/components/header-menu";
import { database } from "@/database/client";
import { tags, tasks, taskTags } from "@/database/schemas/tasks";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { columns } from "./columns";
import { DataTable } from "./data-table";

async function getData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const userTasks = await database
    .select()
    .from(tasks)
    .where(eq(tasks.userId, session.user.id))
    .orderBy(desc(tasks.createdAt));

  // Fetch all tags for these tasks
  const taskIds = userTasks.map((t) => t.id);
  let tagsByTask: Record<string, { id: string; name: string; color: string }[]> = {};

  if (taskIds.length > 0) {
    const allTaskTags = await database
      .select({
        taskId: taskTags.taskId,
        tagId: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id));

    for (const row of allTaskTags) {
      if (!tagsByTask[row.taskId]) {
        tagsByTask[row.taskId] = [];
      }
      tagsByTask[row.taskId].push({
        id: row.tagId,
        name: row.name,
        color: row.color,
      });
    }
  }

  const tasksWithTags = userTasks.map((task) => ({
    ...task,
    tags: tagsByTask[task.id] || [],
  }));

  return { session, userTasks: tasksWithTags };
}

export default async function DashboardPage() {
  const data = await getData();

  if (!data) {
    redirect("/entrar");
  }

  const { session, userTasks } = data;

  // Calculate stats
  const completedTasks = userTasks.filter((t) => t.status === "done");
  const totalDuration = completedTasks.reduce(
    (acc, curr) => acc + (curr.durationSeconds || 0),
    0,
  );
  const totalDurationMinutes = Math.round(totalDuration / 60);

  // Average accuracy for question sets
  const questionSets = completedTasks.filter(
    (t) => t.type === "question_set" && t.totalItems && t.totalItems > 0,
  );
  const accuracy =
    questionSets.length > 0
      ? Math.round(
          (questionSets.reduce(
            (acc, curr) =>
              acc + (curr.correctItems || 0) / (curr.totalItems || 1),
            0,
          ) /
            questionSets.length) *
            100,
        )
      : 0;

  return (
    <div className="flex items-center justify-center container mx-auto py-10 px-6 md:px-8 max-w-5xl">
      <div className="flex flex-col gap-8 w-full">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Painel de Estudos
            </h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo de volta, {session.user.name}.
            </p>
          </div>
          <HeaderMenu />
        </div>

        <div className=" space-y-4">
          <DataTable columns={columns} data={userTasks} />
        </div>
      </div>
    </div>
  );
}
