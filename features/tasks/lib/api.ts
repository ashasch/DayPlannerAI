import type { IsoDate, Task, TaskDraft } from '@/lib/tasks/types';

/**
 * Client-side wrapper around the task endpoints.
 *
 * Every call throws on a non-2xx response so callers can use a single
 * try/catch instead of checking `response.ok` at each site.
 */

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const code =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'unknown';

    throw new Error(code);
  }

  return response.json() as Promise<T>;
}

/** All tasks, scheduled or not. */
export async function fetchTasks(signal?: AbortSignal): Promise<Task[]> {
  const { tasks } = await request<{ tasks: Task[] }>('/api/tasks', { signal });
  return tasks;
}

/** Only scheduled tasks falling inside `[from, to]`. */
export async function fetchTasksInRange(
  from: IsoDate,
  to: IsoDate,
  signal?: AbortSignal,
): Promise<Task[]> {
  const params = new URLSearchParams({ from, to });
  const { tasks } = await request<{ tasks: Task[] }>(`/api/tasks?${params}`, { signal });
  return tasks;
}

export async function createTasks(drafts: TaskDraft[]): Promise<Task[]> {
  const { tasks } = await request<{ tasks: Task[] }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ tasks: drafts }),
  });
  return tasks;
}

export async function updateTask(
  taskId: string,
  patch: Partial<
    Pick<Task, 'title' | 'priority' | 'category' | 'estimatedMinutes' | 'plannedDate' | 'completed'>
  >,
): Promise<Task> {
  const { task } = await request<{ task: Task }>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return task;
}

export async function deleteTask(taskId: string): Promise<void> {
  await request(`/api/tasks/${taskId}`, { method: 'DELETE' });
}
