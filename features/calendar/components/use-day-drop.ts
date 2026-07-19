'use client';

import { useState } from 'react';

import type { IsoDate, Task } from '@/lib/tasks/types';

/** Custom MIME type so the calendar ignores text dragged in from elsewhere. */
export const TASK_DRAG_TYPE = 'application/x-dayplanner-task';

/**
 * Drag & drop wiring for rescheduling.
 *
 * Uses the native HTML drag-and-drop API rather than a library: a task only
 * ever moves between day cells, which native DnD handles with no dependency
 * and with keyboard-accessible fallbacks already available through the task
 * dialog and the Inbox date picker.
 */
export function useDayDrop(onDrop: (task: Task, date: IsoDate) => void) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [overDate, setOverDate] = useState<IsoDate | null>(null);

  function getTaskDragProps(task: Task) {
    return {
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        setDraggedTask(task);
        event.dataTransfer.effectAllowed = 'move';
        // Some browsers cancel the drag unless data is actually set.
        event.dataTransfer.setData(TASK_DRAG_TYPE, task.id);
        event.dataTransfer.setData('text/plain', task.title);
      },
      onDragEnd: () => {
        setDraggedTask(null);
        setOverDate(null);
      },
    };
  }

  function getDayDropProps(date: IsoDate) {
    return {
      onDragOver: (event: React.DragEvent) => {
        if (!draggedTask) return;

        // Preventing default is what marks this element as a valid drop target.
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        if (overDate !== date) setOverDate(date);
      },
      onDragLeave: (event: React.DragEvent) => {
        // Ignore bubbling from children, which would otherwise clear the
        // highlight while the pointer is still inside the cell.
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        if (overDate === date) setOverDate(null);
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        setOverDate(null);

        const task = draggedTask;
        setDraggedTask(null);

        if (task && task.plannedDate !== date) onDrop(task, date);
      },
    };
  }

  return { draggedTask, overDate, getTaskDragProps, getDayDropProps };
}
