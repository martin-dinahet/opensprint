import { err, ok } from "@punpun-dev/ts-result";
import { nanoid } from "nanoid";
import { boardRepository } from "@/server/features/board/repositories";
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

export const listTasks = async (userId: string, boardId: string) => {
  const boardResult = await boardRepository.findById(boardId);
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

  const tasksResult = await taskRepository.findByBoard(boardId);

  if (tasksResult.isErr()) {
    return err(new AppError("tasks-fetch-failed", `Unable to fetch tasks: ${tasksResult.error.message}`, 500));
  }

  return ok(
    (tasksResult.unwrap() || []).map((t) => ({
      id: t.id,
      boardId: t.boardId,
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

export const createTask = async (userId: string, boardId: string, input: CreateTaskInput) => {
  const boardResult = await boardRepository.findById(boardId);
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

  if (input.assigneeId) {
    const assigneeResult = await memberRepository.findById(input.assigneeId);
    if (assigneeResult.isErr()) return err(assigneeResult.error);

    const assignee = assigneeResult.unwrap();
    if (!assignee || assignee.length === 0 || assignee[0].projectId !== board[0].projectId) {
      return err(new NotFoundError("Assignee"));
    }
  }

  const existingTasksResult = await taskRepository.findByBoard(boardId);

  if (existingTasksResult.isErr()) {
    return err(new AppError("tasks-fetch-failed", `Unable to create task: ${existingTasksResult.error.message}`, 500));
  }

  const taskId = nanoid();
  const position = existingTasksResult.unwrap()?.length || 0;

  const createResult = await taskRepository.create({
    id: taskId,
    boardId,
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
    boardId: newTask[0].boardId,
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

export const updateTask = async (userId: string, boardId: string, taskId: string, input: UpdateTaskInput) => {
  const boardResult = await boardRepository.findById(boardId);
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

  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0) {
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
    boardId: updatedTask[0].boardId,
    assigneeId: updatedTask[0].assigneeId,
    title: updatedTask[0].title,
    description: updatedTask[0].description,
    priority: updatedTask[0].priority,
    position: updatedTask[0].position,
    dueDate: updatedTask[0].dueDate,
    updatedAt: updatedTask[0].updatedAt,
  });
};

export const deleteTask = async (userId: string, boardId: string, taskId: string) => {
  const boardResult = await boardRepository.findById(boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const board = boardResult.unwrap();
  if (!board || board.length === 0) {
    return err(new NotFoundError("Board"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, board[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new ForbiddenError("Not authorized"));
  }

  if (membership[0].role === "member") {
    return err(new ForbiddenError("Not authorized"));
  }

  const taskResult = await taskRepository.findById(taskId);
  if (taskResult.isErr()) return err(taskResult.error);

  const task = taskResult.unwrap();
  if (!task || task.length === 0) {
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

  const boardResult = await boardRepository.findById(task[0].boardId);
  if (boardResult.isErr()) return err(boardResult.error);

  const board = boardResult.unwrap();
  if (!board || board.length === 0) {
    return err(new NotFoundError("Board"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, board[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (membership[0].role === "member") {
    return err(new UnauthorizedError("Not authorized"));
  }

  if (input.assigneeId) {
    const assigneeResult = await memberRepository.findById(input.assigneeId);
    if (assigneeResult.isErr()) return err(assigneeResult.error);

    const assignee = assigneeResult.unwrap();
    if (!assignee || assignee.length === 0 || assignee[0].projectId !== board[0].projectId) {
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

  const targetBoardResult = await boardRepository.findById(input.boardId);
  if (targetBoardResult.isErr()) return err(targetBoardResult.error);

  const targetBoard = targetBoardResult.unwrap();
  if (!targetBoard || targetBoard.length === 0) {
    return err(new NotFoundError("Board"));
  }

  const membershipResult = await memberRepository.findByUserAndProject(userId, targetBoard[0].projectId);
  if (membershipResult.isErr()) return err(membershipResult.error);

  const membership = membershipResult.unwrap();
  if (!membership || membership.length === 0) {
    return err(new UnauthorizedError("Not a member of this project"));
  }

  const existingTasksResult = await taskRepository.findByBoard(input.boardId);
  if (existingTasksResult.isErr()) return err(existingTasksResult.error);

  const targetTasks = existingTasksResult.unwrap() ?? [];
  const newPosition = Math.max(0, Math.min(input.position ?? targetTasks.length, targetTasks.length));

  const updateResult = await taskRepository.updateBoardAndPosition(taskId, input.boardId, newPosition);

  if (updateResult.isErr()) {
    return err(new AppError("task-move-failed", `Unable to move task: ${updateResult.error.message}`, 500));
  }

  const normalizedTargetTasks = [
    ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(0, newPosition),
    { ...task[0], boardId: input.boardId },
    ...targetTasks.filter((candidate) => candidate.id !== taskId).slice(newPosition),
  ];
  const targetNormalizeResult = await normalizeTaskPositions(normalizedTargetTasks);

  if (targetNormalizeResult.isErr()) {
    return err(
      new AppError("task-move-failed", `Unable to normalize target board: ${targetNormalizeResult.error.message}`, 500),
    );
  }

  if (task[0].boardId !== input.boardId) {
    const sourceTasksResult = await taskRepository.findByBoard(task[0].boardId);
    if (sourceTasksResult.isErr()) return err(sourceTasksResult.error);

    const sourceNormalizeResult = await normalizeTaskPositions(
      (sourceTasksResult.unwrap() ?? []).filter((candidate) => candidate.id !== taskId),
    );

    if (sourceNormalizeResult.isErr()) {
      return err(
        new AppError(
          "task-move-failed",
          `Unable to normalize source board: ${sourceNormalizeResult.error.message}`,
          500,
        ),
      );
    }
  }

  return ok({
    id: task[0].id,
    boardId: input.boardId,
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

  const boardResult = await boardRepository.findById(task[0].boardId);
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

  const tasksResult = await taskRepository.findByBoard(task[0].boardId);
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
