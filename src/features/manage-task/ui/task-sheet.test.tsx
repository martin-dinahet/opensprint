import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMember, makeTask } from "@/test/factories";
import { TaskSheet } from "./task-sheet";

const {
  assignTaskMock,
  attachTagMock,
  createProjectTagMock,
  createTaskItemMock,
  createTaskMock,
  deleteProjectTagMock,
  deleteTaskItemMock,
  detachTagMock,
  moveTaskMock,
  reorderTaskItemsMock,
  toastMock,
  transferTaskMock,
  updateTaskItemMock,
  updateTaskMock,
} = vi.hoisted(() => ({
  assignTaskMock: vi.fn(),
  attachTagMock: vi.fn(),
  createProjectTagMock: vi.fn(),
  createTaskItemMock: vi.fn(),
  createTaskMock: vi.fn(),
  deleteProjectTagMock: vi.fn(),
  deleteTaskItemMock: vi.fn(),
  detachTagMock: vi.fn(),
  moveTaskMock: vi.fn(),
  reorderTaskItemsMock: vi.fn(),
  toastMock: {
    error: vi.fn(),
    success: vi.fn(),
  },
  transferTaskMock: vi.fn(),
  updateTaskItemMock: vi.fn(),
  updateTaskMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/entities/task", () => ({
  taskApi: {},
  taskKeys: { all: ["tasks"], list: (id: string) => ["tasks", id], projectTags: (id: string) => ["tags", id] },
  useAssignTask: () => ({ mutateAsync: assignTaskMock, isPending: false }),
  useAttachTaskTag: () => ({ mutateAsync: attachTagMock, isPending: false }),
  useCreateProjectTaskTag: () => ({ mutateAsync: createProjectTagMock, isPending: false }),
  useCreateTask: () => ({ mutateAsync: createTaskMock, isPending: false }),
  useCreateTaskItem: () => ({ mutateAsync: createTaskItemMock, isPending: false }),
  useDeleteProjectTaskTag: () => ({ mutate: deleteProjectTagMock, isPending: false }),
  useDeleteTaskItem: () => ({ mutate: deleteTaskItemMock, isPending: false }),
  useDetachTaskTag: () => ({ mutateAsync: detachTagMock, isPending: false }),
  useMoveTask: () => ({ mutateAsync: moveTaskMock, isPending: false }),
  useProjectTaskTags: () => ({
    data: [{ id: "tag-1", projectId: "project-1", name: "QA", color: "#2563eb", createdAt: "", updatedAt: "" }],
  }),
  useReorderTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderTaskItems: () => ({ mutateAsync: reorderTaskItemsMock, isPending: false }),
  useTransferTask: () => ({ mutateAsync: transferTaskMock, isPending: false }),
  useUpdateProjectTaskTag: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutateAsync: updateTaskMock, isPending: false }),
  useUpdateTaskItem: () => ({ mutate: updateTaskItemMock, isPending: false }),
}));

vi.mock("@/entities/project", () => ({
  useProjects: () => ({
    data: [
      { id: "project-1", name: "Current project", description: null, defaultBoardId: "board-1" },
      { id: "project-2", name: "Target project", description: null, defaultBoardId: "board-2" },
    ],
  }),
}));

vi.mock("@/entities/board", () => ({
  useBoards: (projectId: string) => ({
    data:
      projectId === "project-1"
        ? [
            { id: "board-1", projectId: "project-1", name: "Current board" },
            { id: "board-same-project", projectId: "project-1", name: "Same project board" },
          ]
        : projectId === "project-2"
          ? [{ id: "board-2", projectId: "project-2", name: "Target board" }]
          : [],
  }),
}));

vi.mock("@/entities/column", () => ({
  useColumns: (projectId: string, boardId: string) => ({
    data:
      projectId === "project-1" && boardId === "board-same-project"
        ? [{ id: "column-same-project", projectId: "project-1", boardId: "board-same-project", name: "Doing" }]
        : projectId === "project-1" && boardId === "board-1"
          ? [{ id: "column-1", projectId: "project-1", boardId: "board-1", name: "Todo" }]
          : projectId === "project-2" && boardId === "board-2"
            ? [{ id: "column-2", projectId: "project-2", boardId: "board-2", name: "Ready" }]
            : [],
  }),
}));

describe("TaskSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTaskMock.mockResolvedValue(makeTask({ id: "task-new", title: "Created task" }));
    updateTaskMock.mockResolvedValue(makeTask({ id: "task-1", title: "Updated task" }));
    assignTaskMock.mockResolvedValue(makeTask({ id: "task-1" }));
    moveTaskMock.mockResolvedValue({ id: "task-1", columnId: "column-same-project", position: 0 });
    transferTaskMock.mockResolvedValue({ id: "task-1", columnId: "column-2", position: 0 });
  });

  it("creates tasks with draft checklist items and selected tags, then closes with a toast", async () => {
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TaskSheet
        columnId="column-1"
        members={[makeMember()]}
        onCreated={onCreated}
        onOpenChange={onOpenChange}
        open
        projectId="project-1"
        task={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Created task" } });
    fireEvent.change(screen.getByPlaceholderText("Add checklist item…"), { target: { value: "Review it" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "QA" }));
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledWith({
        columnId: "column-1",
        data: expect.objectContaining({
          items: [{ title: "Review it" }],
          tagIds: ["tag-1"],
          title: "Created task",
        }),
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith("Task created");
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: "task-new" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves existing tasks, then closes with a toast", async () => {
    const onOpenChange = vi.fn();

    render(
      <TaskSheet
        members={[makeMember()]}
        onOpenChange={onOpenChange}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", columnId: "column-1", title: "Existing task" })}
      />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Updated task" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateTaskMock).toHaveBeenCalledWith({
        columnId: "column-1",
        data: expect.objectContaining({ title: "Updated task" }),
        taskId: "task-1",
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith("Task saved");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("updates assignee changes while saving an existing task", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const members = [
      makeMember({
        id: "member-2",
        userId: "user-2",
        user: { id: "user-2", name: "Ada Lovelace", email: "ada@example.com", image: null },
      }),
    ];

    render(
      <TaskSheet
        members={members}
        onOpenChange={vi.fn()}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", assigneeId: null, columnId: "column-1" })}
      />,
    );

    await user.click(screen.getByText("Unassigned"));
    await user.click(await screen.findByText("Ada Lovelace"));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(assignTaskMock).toHaveBeenCalledWith({ assigneeId: "member-2", taskId: "task-1" });
    });
  });

  it("adds persisted checklist items to existing tasks", async () => {
    render(
      <TaskSheet
        members={[makeMember()]}
        onOpenChange={vi.fn()}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", columnId: "column-1" })}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Add checklist item…"), { target: { value: "Confirm rollout" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(createTaskItemMock).toHaveBeenCalledWith({
        columnId: "column-1",
        taskId: "task-1",
        title: "Confirm rollout",
      });
    });
  });

  it("renders transfer controls only for existing tasks", () => {
    const { rerender } = render(
      <TaskSheet
        columnId="column-1"
        members={[makeMember()]}
        onOpenChange={vi.fn()}
        open
        projectId="project-1"
        task={null}
      />,
    );

    expect(screen.queryByText("Transfer")).not.toBeInTheDocument();

    rerender(
      <TaskSheet
        members={[makeMember()]}
        onOpenChange={vi.fn()}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", columnId: "column-1" })}
      />,
    );

    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Transfer task" })).toBeDisabled();
  });

  it("moves existing tasks to another board in the same project", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onOpenChange = vi.fn();

    render(
      <TaskSheet
        members={[makeMember()]}
        onOpenChange={onOpenChange}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", columnId: "column-1" })}
      />,
    );

    await user.click(screen.getByLabelText("Target board"));
    await user.click(await screen.findByText("Same project board"));
    await waitFor(() => expect(screen.getByLabelText("Target column")).toBeEnabled());
    await user.click(screen.getByLabelText("Target column"));
    await user.click(await screen.findByText("Doing"));
    await user.click(screen.getByRole("button", { name: "Transfer task" }));

    await waitFor(() => {
      expect(moveTaskMock).toHaveBeenCalledWith({ taskId: "task-1", data: { columnId: "column-same-project" } });
    });
    expect(transferTaskMock).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith("Task transferred");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("transfers existing tasks to another project after choosing a destination", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onOpenChange = vi.fn();

    render(
      <TaskSheet
        members={[makeMember()]}
        onOpenChange={onOpenChange}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", columnId: "column-1" })}
      />,
    );

    await user.click(screen.getByLabelText("Target project"));
    await user.click(await screen.findByText("Target project"));
    await waitFor(() => expect(screen.getByLabelText("Target board")).toBeEnabled());
    await user.click(screen.getByLabelText("Target board"));
    await user.click(await screen.findByText("Target board"));
    await waitFor(() => expect(screen.getByLabelText("Target column")).toBeEnabled());
    await user.click(screen.getByLabelText("Target column"));
    await user.click(await screen.findByText("Ready"));
    await user.click(screen.getByRole("button", { name: "Transfer task" }));

    await waitFor(() => {
      expect(transferTaskMock).toHaveBeenCalledWith({ taskId: "task-1", data: { columnId: "column-2" } });
    });
    expect(moveTaskMock).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith("Task transferred");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows transfer errors in the sheet", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    transferTaskMock.mockRejectedValue(new Error("Transfer failed"));

    render(
      <TaskSheet
        members={[makeMember()]}
        onOpenChange={vi.fn()}
        open
        projectId="project-1"
        task={makeTask({ id: "task-1", columnId: "column-1" })}
      />,
    );

    await user.click(screen.getByLabelText("Target project"));
    await user.click(await screen.findByText("Target project"));
    await waitFor(() => expect(screen.getByLabelText("Target board")).toBeEnabled());
    await user.click(screen.getByLabelText("Target board"));
    await user.click(await screen.findByText("Target board"));
    await waitFor(() => expect(screen.getByLabelText("Target column")).toBeEnabled());
    await user.click(screen.getByLabelText("Target column"));
    await user.click(await screen.findByText("Ready"));
    await user.click(screen.getByRole("button", { name: "Transfer task" }));

    expect(await screen.findByText("Transfer failed")).toBeInTheDocument();
    expect(toastMock.error).toHaveBeenCalledWith("Transfer failed");
  });
});
