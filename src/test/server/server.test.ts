import { err, ok } from "@punpun-dev/ts-result";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/server/lib/errors";
import { createHonoTestClient } from "@/test/backend";
import { makeColumn, makeProject, makeTask, makeUser } from "@/test/factories";

const { authMock, columnUseCasesMock, memberUseCasesMock, projectUseCasesMock, taskUseCasesMock } = vi.hoisted(() => ({
  authMock: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
  projectUseCasesMock: {
    CreateProjectUseCase: { execute: vi.fn() },
    DeleteProjectUseCase: { execute: vi.fn() },
    GetProjectUseCase: { execute: vi.fn() },
    ListProjectsUseCase: { execute: vi.fn() },
    UpdateProjectUseCase: { execute: vi.fn() },
  },
  columnUseCasesMock: {
    CreateColumnUseCase: { execute: vi.fn() },
    DeleteColumnUseCase: { execute: vi.fn() },
    ListColumnsUseCase: { execute: vi.fn() },
    ReorderColumnsUseCase: { execute: vi.fn() },
    UpdateColumnUseCase: { execute: vi.fn() },
  },
  memberUseCasesMock: {
    AddMemberUseCase: { execute: vi.fn() },
    ListMembersUseCase: { execute: vi.fn() },
    RemoveMemberUseCase: { execute: vi.fn() },
    UpdateMemberUseCase: { execute: vi.fn() },
  },
  taskUseCasesMock: {
    AssignTaskUseCase: { execute: vi.fn() },
    CreateTaskUseCase: { execute: vi.fn() },
    DeleteTaskUseCase: { execute: vi.fn() },
    ListTasksUseCase: { execute: vi.fn() },
    MoveTaskUseCase: { execute: vi.fn() },
    ReorderTaskUseCase: { execute: vi.fn() },
    UpdateTaskUseCase: { execute: vi.fn() },
  },
}));

vi.mock("@/server/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/server/use-cases/project", () => projectUseCasesMock);
vi.mock("@/server/use-cases/column", () => columnUseCasesMock);
vi.mock("@/server/use-cases/member", () => memberUseCasesMock);
vi.mock("@/server/use-cases/task", () => taskUseCasesMock);

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
    projectUseCasesMock.ListProjectsUseCase.execute.mockResolvedValue(ok([makeProject()]));

    const client = createHonoTestClient(server);
    const response = await client.api.projects.$get();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ projects: [makeProject()] });
    expect(projectUseCasesMock.ListProjectsUseCase.execute).toHaveBeenCalledWith("user-1");
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
    expect(projectUseCasesMock.CreateProjectUseCase.execute).not.toHaveBeenCalled();
  });

  it("maps use case errors to route responses", async () => {
    projectUseCasesMock.GetProjectUseCase.execute.mockResolvedValue(
      err(new AppError("project-not-found", "Project not found", 404)),
    );

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].$get({ param: { id: "missing-project" } });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      errors: { root: "Project not found" },
    });
  });

  it("passes params and validated bodies to update use cases", async () => {
    projectUseCasesMock.UpdateProjectUseCase.execute.mockResolvedValue(
      ok({ id: "project-1", name: "Updated", description: null, updatedAt: new Date("2026-01-01T00:00:00.000Z") }),
    );

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].$patch({
      param: { id: "project-1" },
      json: { name: "Updated" },
    });

    expect(response.status).toBe(200);
    expect(projectUseCasesMock.UpdateProjectUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", {
      name: "Updated",
    });
  });

  it("routes project creation and deletion requests", async () => {
    projectUseCasesMock.CreateProjectUseCase.execute.mockResolvedValue(
      ok({ id: "project-new", name: "New project", description: null }),
    );
    projectUseCasesMock.DeleteProjectUseCase.execute.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    const createResponse = await client.api.projects.$post({
      json: { name: "New project", description: "Detailed enough" },
    });
    const deleteResponse = await client.api.projects[":id"].$delete({ param: { id: "project-1" } });

    expect(createResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(projectUseCasesMock.CreateProjectUseCase.execute).toHaveBeenCalledWith("user-1", {
      name: "New project",
      description: "Detailed enough",
    });
    expect(projectUseCasesMock.DeleteProjectUseCase.execute).toHaveBeenCalledWith("user-1", "project-1");
  });

  it("routes column listing with project params", async () => {
    columnUseCasesMock.ListColumnsUseCase.execute.mockResolvedValue(ok([makeColumn()]));

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":projectId"].columns.$get({ param: { projectId: "project-1" } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ columns: [makeColumn()] });
    expect(columnUseCasesMock.ListColumnsUseCase.execute).toHaveBeenCalledWith("user-1", "project-1");
  });

  it("routes column create, update, and delete requests", async () => {
    columnUseCasesMock.CreateColumnUseCase.execute.mockResolvedValue(
      ok(makeColumn({ id: "column-new", name: "Doing" })),
    );
    columnUseCasesMock.UpdateColumnUseCase.execute.mockResolvedValue(ok({ ...makeColumn(), name: "Done" }));
    columnUseCasesMock.DeleteColumnUseCase.execute.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    await client.api.projects[":projectId"].columns.$post({
      param: { projectId: "project-1" },
      json: { name: "Doing" },
    });
    await client.api.projects[":projectId"].columns[":columnId"].$patch({
      param: { projectId: "project-1", columnId: "column-1" },
      json: { name: "Done" },
    });
    await client.api.projects[":projectId"].columns[":columnId"].$delete({
      param: { projectId: "project-1", columnId: "column-1" },
    });

    expect(columnUseCasesMock.CreateColumnUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", {
      name: "Doing",
    });
    expect(columnUseCasesMock.UpdateColumnUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", "column-1", {
      name: "Done",
    });
    expect(columnUseCasesMock.DeleteColumnUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", "column-1");
  });

  it("routes column reorder requests", async () => {
    columnUseCasesMock.ReorderColumnsUseCase.execute.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    const response = await client.api.projects[":projectId"].columns.reorder.$patch({
      param: { projectId: "project-1" },
      json: { columnIds: ["column-2", "column-1"] },
    });

    expect(response.status).toBe(200);
    expect(columnUseCasesMock.ReorderColumnsUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", [
      "column-2",
      "column-1",
    ]);
  });

  it("routes member creation requests", async () => {
    memberUseCasesMock.AddMemberUseCase.execute.mockResolvedValue(
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
    expect(memberUseCasesMock.AddMemberUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", {
      email: "user@example.com",
      role: "admin",
    });
  });

  it("routes member list, update, and delete requests", async () => {
    memberUseCasesMock.ListMembersUseCase.execute.mockResolvedValue(ok([]));
    memberUseCasesMock.UpdateMemberUseCase.execute.mockResolvedValue(
      ok({
        id: "member-1",
        userId: "user-2",
        projectId: "project-1",
        role: "admin",
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    memberUseCasesMock.RemoveMemberUseCase.execute.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    await client.api.projects[":id"].members.$get({ param: { id: "project-1" } });
    await client.api.projects[":id"].members[":memberId"].$patch({
      param: { id: "project-1", memberId: "member-1" },
      json: { role: "admin" },
    });
    await client.api.projects[":id"].members[":memberId"].$delete({
      param: { id: "project-1", memberId: "member-1" },
    });

    expect(memberUseCasesMock.ListMembersUseCase.execute).toHaveBeenCalledWith("user-1", "project-1");
    expect(memberUseCasesMock.UpdateMemberUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", "member-1", {
      role: "admin",
    });
    expect(memberUseCasesMock.RemoveMemberUseCase.execute).toHaveBeenCalledWith("user-1", "project-1", "member-1");
  });

  it("validates member update roles", async () => {
    const client = createHonoTestClient(server);
    const response = await client.api.projects[":id"].members[":memberId"].$patch({
      param: { id: "project-1", memberId: "member-1" },
      json: { role: "owner" as never },
    });

    expect(response.status).toBe(403);
    expect(memberUseCasesMock.UpdateMemberUseCase.execute).not.toHaveBeenCalled();
  });

  it("routes column task creation requests", async () => {
    taskUseCasesMock.CreateTaskUseCase.execute.mockResolvedValue(ok(makeTask({ id: "task-new", title: "New task" })));

    const client = createHonoTestClient(server);
    const response = await client.api.columns[":columnId"].tasks.$post({
      param: { columnId: "column-1" },
      json: { title: "New task", priority: "high" },
    });

    expect(response.status).toBe(200);
    expect(taskUseCasesMock.CreateTaskUseCase.execute).toHaveBeenCalledWith("user-1", "column-1", {
      title: "New task",
      priority: "high",
    });
  });

  it("routes task list, update, and delete requests", async () => {
    taskUseCasesMock.ListTasksUseCase.execute.mockResolvedValue(ok([makeTask()]));
    taskUseCasesMock.UpdateTaskUseCase.execute.mockResolvedValue(ok(makeTask({ title: "Updated" })));
    taskUseCasesMock.DeleteTaskUseCase.execute.mockResolvedValue(ok({ success: true }));

    const client = createHonoTestClient(server);
    await client.api.columns[":columnId"].tasks.$get({ param: { columnId: "column-1" } });
    await client.api.columns[":columnId"].tasks[":taskId"].$patch({
      param: { columnId: "column-1", taskId: "task-1" },
      json: { title: "Updated" },
    });
    await client.api.columns[":columnId"].tasks[":taskId"].$delete({
      param: { columnId: "column-1", taskId: "task-1" },
    });

    expect(taskUseCasesMock.ListTasksUseCase.execute).toHaveBeenCalledWith("user-1", "column-1");
    expect(taskUseCasesMock.UpdateTaskUseCase.execute).toHaveBeenCalledWith("user-1", "column-1", "task-1", {
      title: "Updated",
    });
    expect(taskUseCasesMock.DeleteTaskUseCase.execute).toHaveBeenCalledWith("user-1", "column-1", "task-1");
  });

  it("routes task assignment and reorder requests", async () => {
    taskUseCasesMock.AssignTaskUseCase.execute.mockResolvedValue(ok({ id: "task-1", assigneeId: null }));
    taskUseCasesMock.ReorderTaskUseCase.execute.mockResolvedValue(ok({ id: "task-1", position: 2 }));

    const client = createHonoTestClient(server);
    await client.api.tasks[":taskId"].assign.$patch({
      param: { taskId: "task-1" },
      json: { assigneeId: null },
    });
    await client.api.tasks[":taskId"].reorder.$patch({
      param: { taskId: "task-1" },
      json: { position: 2 },
    });

    expect(taskUseCasesMock.AssignTaskUseCase.execute).toHaveBeenCalledWith("user-1", "task-1", { assigneeId: null });
    expect(taskUseCasesMock.ReorderTaskUseCase.execute).toHaveBeenCalledWith("user-1", "task-1", { position: 2 });
  });

  it("routes task movement requests", async () => {
    taskUseCasesMock.MoveTaskUseCase.execute.mockResolvedValue(ok({ id: "task-1", columnId: "column-2", position: 0 }));

    const client = createHonoTestClient(server);
    const response = await client.api.tasks[":taskId"].move.$patch({
      param: { taskId: "task-1" },
      json: { columnId: "column-2", position: 0 },
    });

    expect(response.status).toBe(200);
    expect(taskUseCasesMock.MoveTaskUseCase.execute).toHaveBeenCalledWith("user-1", "task-1", {
      columnId: "column-2",
      position: 0,
    });
  });
});
