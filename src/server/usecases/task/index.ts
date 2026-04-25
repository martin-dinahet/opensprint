import { nanoid } from "nanoid";
import { boardRepository } from "@/server/repositories";
import { memberRepository } from "@/server/repositories";
import { taskRepository } from "@/server/repositories";
import { NotFoundError, UnauthorizedError, ForbiddenError } from "../errors";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  AssignTaskInput,
  MoveTaskInput,
  ReorderTaskInput,
  TaskOutput,
} from "@/server/dto";

export class ListTasksUseCase {
  async execute(userId: string, boardId: string): Promise<TaskOutput[]> {
    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      board[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: tasks, error: tasksError } = await taskRepository.findByBoard(boardId);

    if (tasksError) {
      throw new Error(`Unable to fetch tasks: ${tasksError}`);
    }

    return (tasks || []).map((t) => ({
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
    }));
  }
}

export class CreateTaskUseCase {
  async execute(userId: string, boardId: string, input: CreateTaskInput) {
    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      board[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    if (input.assigneeId) {
      const { data: assignee } = await memberRepository.findById(input.assigneeId);
      if (!assignee || assignee.length === 0 || assignee[0].projectId !== board[0].projectId) {
        throw new NotFoundError("Assignee");
      }
    }

    const { data: existingTasks, error: tasksError } = await taskRepository.findByBoard(boardId);

    if (tasksError) {
      throw new Error(`Unable to create task: ${tasksError}`);
    }

    const taskId = nanoid();
    const position = existingTasks?.length || 0;

    const { error: createError } = await taskRepository.create({
      id: taskId,
      boardId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId,
      dueDate: input.dueDate,
      position,
    });

    if (createError) {
      throw new Error(`Unable to create task: ${createError}`);
    }

    const { data: newTask } = await taskRepository.findById(taskId);
    if (!newTask || newTask.length === 0) {
      throw new Error("Unable to fetch new task");
    }

    return {
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
    };
  }
}

export class UpdateTaskUseCase {
  async execute(userId: string, boardId: string, taskId: string, input: UpdateTaskInput) {
    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      board[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: task, error: taskError } = await taskRepository.findById(taskId);

    if (taskError || !task || task.length === 0) {
      throw new NotFoundError("Task");
    }

    const { error: updateError } = await taskRepository.update(taskId, input);

    if (updateError) {
      throw new Error(`Unable to update task: ${updateError}`);
    }

    const { data: updatedTask } = await taskRepository.findById(taskId);
    if (!updatedTask || updatedTask.length === 0) {
      throw new Error("Unable to fetch updated task");
    }

    return {
      id: updatedTask[0].id,
      boardId: updatedTask[0].boardId,
      assigneeId: updatedTask[0].assigneeId,
      title: updatedTask[0].title,
      description: updatedTask[0].description,
      priority: updatedTask[0].priority,
      position: updatedTask[0].position,
      dueDate: updatedTask[0].dueDate,
      updatedAt: updatedTask[0].updatedAt,
    };
  }
}

export class DeleteTaskUseCase {
  async execute(userId: string, boardId: string, taskId: string) {
    const { data: board, error: boardError } = await boardRepository.findById(boardId);

    if (boardError || !board || board.length === 0) {
      throw new NotFoundError("Board");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      board[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new ForbiddenError("Not authorized");
    }

    if (membership[0].role === "member") {
      throw new ForbiddenError("Not authorized");
    }

    const { data: task, error: taskError } = await taskRepository.findById(taskId);

    if (taskError || !task || task.length === 0) {
      throw new NotFoundError("Task");
    }

    const { error: deleteError } = await taskRepository.delete(taskId);

    if (deleteError) {
      throw new Error(`Unable to delete task: ${deleteError}`);
    }

    return { success: true };
  }
}

export class AssignTaskUseCase {
  async execute(userId: string, taskId: string, input: AssignTaskInput) {
    const { data: task, error: taskError } = await taskRepository.findById(taskId);

    if (taskError || !task || task.length === 0) {
      throw new NotFoundError("Task");
    }

    const { data: board } = await boardRepository.findById(task[0].boardId);

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      board[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not authorized");
    }

    if (membership[0].role === "member") {
      throw new UnauthorizedError("Not authorized");
    }

    if (input.assigneeId) {
      const { data: assignee } = await memberRepository.findById(input.assigneeId);
      if (!assignee || assignee.length === 0 || assignee[0].projectId !== board[0].projectId) {
        throw new NotFoundError("Assignee");
      }
    }

    const { error: updateError } = await taskRepository.updateAssignee(taskId, input.assigneeId);

    if (updateError) {
      throw new Error(`Unable to assign task: ${updateError}`);
    }

    return {
      id: task[0].id,
      assigneeId: input.assigneeId,
    };
  }
}

export class MoveTaskUseCase {
  async execute(userId: string, taskId: string, input: MoveTaskInput) {
    const { data: task, error: taskError } = await taskRepository.findById(taskId);

    if (taskError || !task || task.length === 0) {
      throw new NotFoundError("Task");
    }

    const { data: targetBoard, error: targetBoardError } = await boardRepository.findById(input.boardId);

    if (targetBoardError || !targetBoard || targetBoard.length === 0) {
      throw new NotFoundError("Board");
    }

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      targetBoard[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { data: existingTasks } = await taskRepository.findByBoard(input.boardId);
    const newPosition = input.position ?? (existingTasks?.length || 0);

    const { error: updateError } = await taskRepository.updateBoardAndPosition(taskId, input.boardId, newPosition);

    if (updateError) {
      throw new Error(`Unable to move task: ${updateError}`);
    }

    return {
      id: task[0].id,
      boardId: input.boardId,
      position: newPosition,
    };
  }
}

export class ReorderTaskUseCase {
  async execute(userId: string, taskId: string, input: ReorderTaskInput) {
    const { data: task, error: taskError } = await taskRepository.findById(taskId);

    if (taskError || !task || task.length === 0) {
      throw new NotFoundError("Task");
    }

    const { data: board } = await boardRepository.findById(task[0].boardId);

    const { data: membership, error: membershipError } = await memberRepository.findByUserAndProject(
      userId,
      board[0].projectId,
    );

    if (membershipError || !membership || membership.length === 0) {
      throw new UnauthorizedError("Not a member of this project");
    }

    const { error: updateError } = await taskRepository.updatePosition(taskId, input.position);

    if (updateError) {
      throw new Error(`Unable to reorder task: ${updateError}`);
    }

    return {
      id: task[0].id,
      position: input.position,
    };
  }
}

export const listTasksUseCase = new ListTasksUseCase();
export const createTaskUseCase = new CreateTaskUseCase();
export const updateTaskUseCase = new UpdateTaskUseCase();
export const deleteTaskUseCase = new DeleteTaskUseCase();
export const assignTaskUseCase = new AssignTaskUseCase();
export const moveTaskUseCase = new MoveTaskUseCase();
export const reorderTaskUseCase = new ReorderTaskUseCase();
