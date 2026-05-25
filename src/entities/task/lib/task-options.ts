import type { TaskKind, TaskPriority } from "../types";

export const taskPriorityItems: Record<TaskPriority, string> = {
  high: "High",
  low: "Low",
  medium: "Medium",
  urgent: "Urgent",
};

export const taskKindItems: Record<TaskKind, string> = {
  bug: "Bug",
  chore: "Chore",
  feature: "Feature",
  task: "Task",
};

export const taskTagPalette = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2"] as const;

export const toDateInputValue = (value: string | null) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};
