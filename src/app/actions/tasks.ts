"use server";

import { database } from "@/database/client";
import { tags, tasks, taskTags } from "@/database/schemas/tasks";
import { auth } from "@/lib/auth";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// --- TASKS ---

export async function getTasks() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userTasks = await database
    .select()
    .from(tasks)
    .where(eq(tasks.userId, session.user.id))
    .orderBy(desc(tasks.createdAt));

  return userTasks;
}

export async function createTask(data: {
  title: string;
  description: string;
  tagIds: string[];
  type: "simple" | "question_set" | "other";
  totalItems: number;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const [newTask] = await database
    .insert(tasks)
    .values({
      userId: session.user.id,
      title: data.title,
      description: data.description,
      type: data.type,
      totalItems: data.totalItems,
      status: "todo",
    })
    .returning({ id: tasks.id });

  if (data.tagIds && data.tagIds.length > 0) {
    await database.insert(taskTags).values(
      data.tagIds.map((tagId) => ({
        taskId: newTask.id,
        tagId,
      })),
    );
  }

  revalidatePath("/tarefas");
}

export async function updateTaskStatus(
  taskId: string,
  status: "todo" | "in_progress" | "done",
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await database
    .update(tasks)
    .set({ status })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  revalidatePath("/tarefas");
}

export async function completeTask(
  taskId: string,
  data: {
    durationSeconds: number;
    correctItems?: number;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await database
    .update(tasks)
    .set({
      status: "done",
      // use DB server time to avoid clock/timezone drift between app and DB
      completedAt: sql`now()`,
      durationSeconds: data.durationSeconds,
      correctItems: data.correctItems,
    })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  revalidatePath("/tarefas");
}

export async function deleteTask(taskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await database
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));

  revalidatePath("/tarefas");
}

// --- TAGS ---

export async function getTags() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userTags = await database
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id));

  return userTags;
}

export async function createTag(name: string, color: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const [newTag] = await database
    .insert(tags)
    .values({
      userId: session.user.id,
      name,
      color,
    })
    .returning();

  return newTag;
}

export async function getTaskTags(taskIds: string[]) {
  if (taskIds.length === 0) return [];

  return database
    .select({
      taskId: taskTags.taskId,
      tagId: taskTags.tagId,
      name: tags.name,
      color: tags.color,
    })
    .from(taskTags)
    .innerJoin(tags, eq(taskTags.tagId, tags.id))
    .where(inArray(taskTags.taskId, taskIds));
}
