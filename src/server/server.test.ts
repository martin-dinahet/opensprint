import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHonoTestClient } from "@/test/backend";
import { makeBoard, makeProject, makeTask, makeUser } from "@/test/factories";
import { AppError } from "./features/shared/errors";

const { authMock, boardUseCasesMock, memberUseCasesMock, projectUseCasesMock, taskUseCasesMock } = vi.hoisted(() => ({
  authMock: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
  projectUseCasesMock: {
    createProject: vi.fn(),
    deleteProject: vi.fn(),
    getProject: vi.fn(),
    listProjects: vi.fn(),
    updateProject: vi.fn(),
  },
  boardUseCasesMock: {
    createBoard: vi.fn(),
    deleteBoard: vi.fn(),
    getBoard: vi.fn(),
    listBoards: vi.fn(),
    reorderBoards: vi.fn(),
    updateBoard: vi.fn(),
  },
  memberUseCasesMock: {
    addMember: vi.fn(),
    listMembers: vi.fn(),
    removeMember: vi.fn(),
    updateMember: vi.fn(),
  },
  taskUseCasesMock: {
    assignTask: vi.fn(),
    createTask: vi.fn(),
    deleteTask: vi.fn(),
    listTasks: vi.fn(),
    moveTask: vi.fn(),
    reorderTask: vi.fn(),
    updateTask: vi.fn(),
  },
}));

vi.mock("@/server/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/server/features/project/usecases", () => projectUseCasesMock);
vi.mock("@/server/features/board/usecases", () => boardUseCasesMock);
vi.mock("@/server/features/member/usecases", () => memberUseCasesMock);
vi.mock("@/server/features/task/usecases", () => taskUseCasesMock);

const { server } = await import("@/server");

describe("server routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.api.getSession.mockResolvedValue({
      user: makeUser(),
      session: { id: "session-1", userId: "user-1" },
    });
  });

  it("responds to health checks through app.request", async () => {
    const response = await server.request("/api/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "OK" });
  });

  it("lists projects through Hono testClient", async () => {
    projectUseCasesMock.listProjects.mockResolvedValue(ok([makeProject()]));

    const client = createHonoTestClient(server);
    const response = await client.api.projects.$get();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ projects: [makeProject()] });
    expect(projectUseCasesMock.listProjects).toHaveBeenCalledWith("user-1");
  });

  it("returns 401 when a guarded route has no session", async () => {
    authMock.api.getSession.mockResolvedValue(null);

    const client = createHonoTestClient(server);
    const response = await client.api.projects.$get();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errors: { root: "Not authenticated" },
    });
  });

  it("validates project create bodies", async () => {
    const client = createHonoTestClient(server);
    const response = await client.api.projects.$post({ json: { name: "x" } });

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ success: false });
    expect(projectUseCasesMock.createProject).not.toHaveBeenCalled();
  });

  it("maps use case errors to route responses", async () => {
    projectUseCasesMock.getProject.mockResolvedValue(err(new AppError("project-not-found", "Project not found", 404)));

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].$get({ param: { id: "missing-project" } });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errors: { root: "Project not found" },
    });
  });

  it("passes params and validated bodies to update use cases", async () => {
    projectUseCasesMock.updateProject.mockResolvedValue(
      ok({ id: "project-1", name: "Updated", description: null, updatedAt: new Date("2026-01-01T00:00:00.000Z") }),
    );

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].$patch({
      param: { id: "project-1" },
      json: { name: "Updated" },
    });

    expect(response.status).toBe(200);
    expect(projectUseCasesMock.updateProject).toHaveBeenCalledWith("user-1", "project-1", { name: "Updated" });
  });

  it("routes project creation and deletion requests", async () => {
    projectUseCasesMock.createProject.mockResolvedValue(
      ok({ id: "project-new", name: "New project", description: null }),
    );
    projectUseCasesMock.deleteProject.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    const createResponse = await client.api.projects.$post({
      json: { name: "New project", description: "Detailed enough" },
    });
    const deleteResponse = await client.api.projects[":id"].$delete({ param: { id: "project-1" } });

    expect(createResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(projectUseCasesMock.createProject).toHaveBeenCalledWith("user-1", {
      name: "New project",
      description: "Detailed enough",
    });
    expect(projectUseCasesMock.deleteProject).toHaveBeenCalledWith("user-1", "project-1");
  });

  it("routes board listing with project params", async () => {
    boardUseCasesMock.listBoards.mockResolvedValue(ok([makeBoard()]));

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].boards.$get({ param: { id: "project-1" } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ boards: [makeBoard()] });
    expect(boardUseCasesMock.listBoards).toHaveBeenCalledWith("user-1", "project-1");
  });

  it("routes board create, get, update, and delete requests", async () => {
    boardUseCasesMock.createBoard.mockResolvedValue(ok(makeBoard({ id: "board-new", name: "Doing" })));
    boardUseCasesMock.getBoard.mockResolvedValue(ok(makeBoard()));
    boardUseCasesMock.updateBoard.mockResolvedValue(ok({ ...makeBoard(), name: "Done" }));
    boardUseCasesMock.deleteBoard.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    await client.api.projects[":id"].boards.$post({
      param: { id: "project-1" },
      json: { name: "Doing" },
    });
    await client.api.projects[":id"].boards[":boardId"].$get({
      param: { id: "project-1", boardId: "board-1" },
    });
    await client.api.projects[":id"].boards[":boardId"].$patch({
      param: { id: "project-1", boardId: "board-1" },
      json: { name: "Done" },
    });
    await client.api.projects[":id"].boards[":boardId"].$delete({
      param: { id: "project-1", boardId: "board-1" },
    });

    expect(boardUseCasesMock.createBoard).toHaveBeenCalledWith("user-1", "project-1", { name: "Doing" });
    expect(boardUseCasesMock.getBoard).toHaveBeenCalledWith("user-1", "project-1", "board-1");
    expect(boardUseCasesMock.updateBoard).toHaveBeenCalledWith("user-1", "project-1", "board-1", { name: "Done" });
    expect(boardUseCasesMock.deleteBoard).toHaveBeenCalledWith("user-1", "project-1", "board-1");
  });

  it("routes board reorder requests", async () => {
    boardUseCasesMock.reorderBoards.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].boards.reorder.$patch({
      param: { id: "project-1" },
      json: { boardIds: ["board-2", "board-1"] },
    });

    expect(response.status).toBe(200);
    expect(boardUseCasesMock.reorderBoards).toHaveBeenCalledWith("user-1", "project-1", ["board-2", "board-1"]);
  });

  it("routes member creation requests", async () => {
    memberUseCasesMock.addMember.mockResolvedValue(
      ok({
        id: "member-1",
        userId: "user-2",
        projectId: "project-1",
        role: "admin",
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].members.$post({
      param: { id: "project-1" },
      json: { email: "user@example.com", role: "admin" },
    });

    expect(response.status).toBe(200);
    expect(memberUseCasesMock.addMember).toHaveBeenCalledWith("user-1", "project-1", {
      email: "user@example.com",
      role: "admin",
    });
  });

  it("routes member list, update, and delete requests", async () => {
    memberUseCasesMock.listMembers.mockResolvedValue(ok([]));
    memberUseCasesMock.updateMember.mockResolvedValue(
      ok({
        id: "member-1",
        userId: "user-2",
        projectId: "project-1",
        role: "admin",
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    memberUseCasesMock.removeMember.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    await client.api.projects[":id"].members.$get({ param: { id: "project-1" } });
    await client.api.projects[":id"].members[":memberId"].$patch({
      param: { id: "project-1", memberId: "member-1" },
      json: { role: "admin" },
    });
    await client.api.projects[":id"].members[":memberId"].$delete({
      param: { id: "project-1", memberId: "member-1" },
    });

    expect(memberUseCasesMock.listMembers).toHaveBeenCalledWith("user-1", "project-1");
    expect(memberUseCasesMock.updateMember).toHaveBeenCalledWith("user-1", "project-1", "member-1", {
      role: "admin",
    });
    expect(memberUseCasesMock.removeMember).toHaveBeenCalledWith("user-1", "project-1", "member-1");
  });

  it("validates member update roles", async () => {
    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].members[":memberId"].$patch({
      param: { id: "project-1", memberId: "member-1" },
      json: { role: "owner" as never },
    });

    expect(response.status).toBe(403);
    expect(memberUseCasesMock.updateMember).not.toHaveBeenCalled();
  });

  it("routes board task creation requests", async () => {
    taskUseCasesMock.createTask.mockResolvedValue(ok(makeTask({ id: "task-new", title: "New task" })));

    const client = createHonoTestClient(server);
    const response = await client.api.boards[":boardId"].tasks.$post({
      param: { boardId: "board-1" },
      json: { title: "New task", priority: "high" },
    });

    expect(response.status).toBe(200);
    expect(taskUseCasesMock.createTask).toHaveBeenCalledWith("user-1", "board-1", {
      title: "New task",
      priority: "high",
    });
  });

  it("routes task list, update, and delete requests", async () => {
    taskUseCasesMock.listTasks.mockResolvedValue(ok([makeTask()]));
    taskUseCasesMock.updateTask.mockResolvedValue(ok(makeTask({ title: "Updated" })));
    taskUseCasesMock.deleteTask.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    await client.api.boards[":boardId"].tasks.$get({ param: { boardId: "board-1" } });
    await client.api.boards[":boardId"].tasks[":taskId"].$patch({
      param: { boardId: "board-1", taskId: "task-1" },
      json: { title: "Updated" },
    });
    await client.api.boards[":boardId"].tasks[":taskId"].$delete({
      param: { boardId: "board-1", taskId: "task-1" },
    });

    expect(taskUseCasesMock.listTasks).toHaveBeenCalledWith("user-1", "board-1");
    expect(taskUseCasesMock.updateTask).toHaveBeenCalledWith("user-1", "board-1", "task-1", { title: "Updated" });
    expect(taskUseCasesMock.deleteTask).toHaveBeenCalledWith("user-1", "board-1", "task-1");
  });

  it("routes task assignment and reorder requests", async () => {
    taskUseCasesMock.assignTask.mockResolvedValue(ok({ id: "task-1", assigneeId: null }));
    taskUseCasesMock.reorderTask.mockResolvedValue(ok({ id: "task-1", position: 2 }));

    const client = createHonoTestClient(server);
    await client.api.tasks[":taskId"].assign.$patch({
      param: { taskId: "task-1" },
      json: { assigneeId: null },
    });
    await client.api.tasks[":taskId"].reorder.$patch({
      param: { taskId: "task-1" },
      json: { position: 2 },
    });

    expect(taskUseCasesMock.assignTask).toHaveBeenCalledWith("user-1", "task-1", { assigneeId: null });
    expect(taskUseCasesMock.reorderTask).toHaveBeenCalledWith("user-1", "task-1", { position: 2 });
  });

  it("routes task movement requests", async () => {
    taskUseCasesMock.moveTask.mockResolvedValue(ok({ id: "task-1", boardId: "board-2", position: 0 }));

    const client = createHonoTestClient(server);
    const response = await client.api.tasks[":taskId"].move.$patch({
      param: { taskId: "task-1" },
      json: { boardId: "board-2", position: 0 },
    });

    expect(response.status).toBe(200);
    expect(taskUseCasesMock.moveTask).toHaveBeenCalledWith("user-1", "task-1", {
      boardId: "board-2",
      position: 0,
    });
  });
});
