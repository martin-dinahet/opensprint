import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { boardRepository } from "@/server/features/board/repositories";
import { columnRepository } from "@/server/features/column/repositories";
import { memberRepository } from "@/server/features/member/repositories";
import { AppError, ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/features/shared/errors";
import type { AssignTaskInput, CreateTaskInput, MoveTaskInput, ReorderTaskInput, UpdateTaskInput } from "../dto";
import { taskRepository } from "../repositories";

const normalizeTaskPositions = async (tasks: { id: string }[]) => {
  for (let index = 0; index < tasks.length; index++) {
    const updateResult = await taskRepository.updatePosition(tasks[index].id, index);
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }
  }

  return ok(undefined);
};

const insertTaskAtPosition = <T extends { id: string }>(tasks: T[], taskId: string, position: number) => {
  const nextTasks = tasks.filter((candidate) => candidate.id !== taskId);
  const task = tasks.find((candidate) => candidate.id === taskId);

  if (!task) return nextTasks;

  nextTasks.splice(Math.max(0, Math.min(position, nextTasks.length)), 0, task);

  return nextTasks;
};

const getColumnForMember = async (userId: string, columnId: string) => {
  const columnResult = await columnRepository.findById(columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const column = columnResult.unwrap();
  if (!column || column.length === 0) {
    return err(new NotFoundError("Column"));
  }

  const boardResult = await boardRepository.findById(column[0].boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const board = boardResult.unwrap();
  if (!board || board.length === 0) {
    return err(new NotFoundError("Board"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, board[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  return ok({ board: board[0], column: column[0], membership: membership[0] });
};

export const listTasks = async (userId: string, columnId: string) => {
  const columnResult = await getColumnForMember(userId, columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const tasksResult = await taskRepository.findByColumn(columnId);

  if (tasksResult.isErr()) {
    return err(new AppError("tasks-fetch-failed", `Unable to fetch tasks: ${tasksResult.error.message}`, 500));
  }

  return ok(
    (tasksResult.unwrap() || []).map((t) => ({
      id: t.id,
      columnId: t.columnId,
      assigneeId: t.assigneeId,
      title: t.title,
      description: t.description,
      priority: t.priority,
      position: t.position,
      dueDate: t.dueDate,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  );
};

export const createTask = async (userId: string, columnId: string, input: CreateTaskInput) => {
  const columnResult = await getColumnForMember(userId, columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const { board } = columnResult.unwrap();

  if (input.assigneeId) {
    const assigneeResult = await memberRepository.findById(input.assigneeId);
    if (assigneeResult.isErr()) return err(assigneeResult.error);

    const assignee = assigneeResult.unwrap();
    if (!assignee || assignee.length === 0 || assignee[0].projectId !== board.projectId) {
      return err(new NotFoundError("Assignee"));
    }
  }

  const existingTasksResult = await taskRepository.findByColumn(columnId);

  if (existingTasksResult.isErr()) {
    return err(new AppError("tasks-fetch-failed", `Unable to create task: ${existingTasksResult.error.message}`, 500));
  }

  const taskId = nanoid();
  const position = existingTasksResult.unwrap()?.length || 0;

  const createResult = await taskRepository.create({
    id: taskId,
    columnId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    position,
  });

  if (createResult.isErr()) {
    return err(new AppError("task-create-failed", `Unable to create task: ${createResult.error.message}`, 500));
  }

  const newTaskResult = await taskRepository.findById(taskId);
  if (newTaskResult.isErr()) return err(newTaskResult.error);

  const newTask = newTaskResult.unwrap();
  if (!newTask || newTask.length === 0) {
    return err(new AppError("task-fetch-failed", "Unable to fetch new task", 500));
  }

  return ok({
    id: newTask[0].id,
    columnId: newTask[0].columnId,
    assigneeId: newTask[0].assigneeId,
    title: newTask[0].title,
    description: newTask[0].description,
    priority: newTask[0].priority,
    position: newTask[0].position,
    dueDate: newTask[0].dueDate,
    createdAt: newTask[0].createdAt,
    updatedAt: newTask[0].updatedAt,
  });
};

export const updateTask = async (userId: string, columnId: string, taskId: string, input: UpdateTaskInput) => {
  const columnResult = await getColumnForMember(userId, columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0 || task[0].columnId !== columnId) {
    return err(new NotFoundError("Task"));
  }

  const updateResult = await taskRepository.update(taskId, input);

  if (updateResult.isErr()) {
    return err(new AppError("task-update-failed", `Unable to update task: ${updateResult.error.message}`, 500));
  }

  const updatedTaskResult = await taskRepository.findById(taskId);
  if (updatedTaskResult.isErr()) return err(updatedTaskResult.error);

  const updatedTask = updatedTaskResult.unwrap();
  if (!updatedTask || updatedTask.length === 0) {
    return err(new AppError("task-fetch-failed", "Unable to fetch updated task", 500));
  }

  return ok({
    id: updatedTask[0].id,
    columnId: updatedTask[0].columnId,
    assigneeId: updatedTask[0].assigneeId,
    title: updatedTask[0].title,
    description: updatedTask[0].description,
    priority: updatedTask[0].priority,
    position: updatedTask[0].position,
    dueDate: updatedTask[0].dueDate,
    updatedAt: updatedTask[0].updatedAt,
  });
};

export const deleteTask = async (userId: string, columnId: string, taskId: string) => {
  const columnResult = await getColumnForMember(userId, columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  if (columnResult.unwrap().membership.role === "member") {
    return err(new ForbiddenError("Not authorized"));
  }

  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0 || task[0].columnId !== columnId) {
    return err(new NotFoundError("Task"));
  }

  const deleteResult = await taskRepository.delete(taskId);

  if (deleteResult.isErr()) {
    return err(new AppError("task-delete-failed", `Unable to delete task: ${deleteResult.error.message}`, 500));
  }

  return ok({ success: true });
};

export const assignTask = async (userId: string, taskId: string, input: AssignTaskInput) => {
  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0) {
    return err(new NotFoundError("Task"));
  }

  const columnResult = await getColumnForMember(userId, task[0].columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const { board, membership } = columnResult.unwrap();

  if (membership.role === "member") {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (input.assigneeId) {
    const assigneeResult = await memberRepository.findById(input.assigneeId);
    if (assigneeResult.isErr()) return err(assigneeResult.error);

    const assignee = assigneeResult.unwrap();
    if (!assignee || assignee.length === 0 || assignee[0].projectId !== board.projectId) {
      return err(new NotFoundError("Assignee"));
    }
  }

  const updateResult = await taskRepository.updateAssignee(taskId, input.assigneeId);

  if (updateResult.isErr()) {
    return err(new AppError("task-assign-failed", `Unable to assign task: ${updateResult.error.message}`, 500));
  }

  return ok({
    id: task[0].id,
    assigneeId: input.assigneeId,
  });
};

export const moveTask = async (userId: string, taskId: string, input: MoveTaskInput) => {
  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0) {
    return err(new NotFoundError("Task"));
  }

  const sourceColumnResult = await getColumnForMember(userId, task[0].columnId);
  if (sourceColumnResult.isErr()) return err(sourceColumnResult.error);

  const targetColumnResult = await getColumnForMember(userId, input.columnId);
  if (targetColumnResult.isErr()) return err(targetColumnResult.error);

  const sourceProjectId = sourceColumnResult.unwrap().board.projectId;
  const targetProjectId = targetColumnResult.unwrap().board.projectId;

  if (sourceProjectId !== targetProjectId) {
    return err(new NotFoundError("Column"));
  }

  const existingTasksResult = await taskRepository.findByColumn(input.columnId);
  if (existingTasksResult.isErr()) return err(existingTasksResult.error);

  const targetTasks = existingTasksResult.unwrap() ?? [];
  const newPosition = Math.max(0, Math.min(input.position ?? targetTasks.length, targetTasks.length));

  const updateResult = await taskRepository.updateColumnAndPosition(taskId, input.columnId, newPosition);

  if (updateResult.isErr()) {
    return err(new AppError("task-move-failed", `Unable to move task: ${updateResult.error.message}`, 500));
  }

  const normalizedTargetTasks = [
    ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(0, newPosition),
    { ...task[0], columnId: input.columnId },
    ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(newPosition),
  ];
  const targetNormalizeResult = await normalizeTaskPositions(normalizedTargetTasks);

  if (targetNormalizeResult.isErr()) {
    return err(
      new AppError(
        "task-move-failed",
        `Unable to normalize target column: ${targetNormalizeResult.error.message}`,
        500,
      ),
    );
  }

  if (task[0].columnId !== input.columnId) {
    const sourceTasksResult = await taskRepository.findByColumn(task[0].columnId);
    if (sourceTasksResult.isErr()) return err(sourceTasksResult.error);

    const sourceNormalizeResult = await normalizeTaskPositions(
      (sourceTasksResult.unwrap() ?? []).filter((candidate) => candidate.id !== taskId),
    );

    if (sourceNormalizeResult.isErr()) {
      return err(
        new AppError(
          "task-move-failed",
          `Unable to normalize source column: ${sourceNormalizeResult.error.message}`,
          500,
        ),
      );
    }
  }

  return ok({
    id: task[0].id,
    columnId: input.columnId,
    position: newPosition,
  });
};

export const reorderTask = async (userId: string, taskId: string, input: ReorderTaskInput) => {
  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0) {
    return err(new NotFoundError("Task"));
  }

  const columnResult = await getColumnForMember(userId, task[0].columnId);
  if (columnResult.isErr()) return err(columnResult.error);

  const tasksResult = await taskRepository.findByColumn(task[0].columnId);
  if (tasksResult.isErr()) return err(tasksResult.error);

  const reorderedTasks = insertTaskAtPosition(tasksResult.unwrap() ?? [], taskId, input.position);
  const updateResult = await normalizeTaskPositions(reorderedTasks);

  if (updateResult.isErr()) {
    return err(new AppError("task-reorder-failed", `Unable to reorder task: ${updateResult.error.message}`, 500));
  }

  return ok({
    id: task[0].id,
    position: Math.max(0, Math.min(input.position, reorderedTasks.length - 1)),
  });
};
