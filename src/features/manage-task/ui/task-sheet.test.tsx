import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
  reorderTaskItemsMock,
  toastMock,
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
  reorderTaskItemsMock: vi.fn(),
  toastMock: {
    error: vi.fn(),
    success: vi.fn(),
  },
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
  useMoveTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProjectTaskTags: () => ({
    data: [{ id: "tag-1", projectId: "project-1", name: "QA", color: "#2563eb", createdAt: "", updatedAt: "" }],
  }),
  useReorderTask: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useReorderTaskItems: () => ({ mutateAsync: reorderTaskItemsMock, isPending: false }),
  useUpdateProjectTaskTag: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTask: () => ({ mutateAsync: updateTaskMock, isPending: false }),
  useUpdateTaskItem: () => ({ mutate: updateTaskItemMock, isPending: false }),
}));

describe("TaskSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTaskMock.mockResolvedValue(makeTask({ id: "task-new", title: "Created task" }));
    updateTaskMock.mockResolvedValue(makeTask({ id: "task-1", title: "Updated task" }));
    assignTaskMock.mockResolvedValue(makeTask({ id: "task-1" }));
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
    fireEvent.change(screen.getByPlaceholderText("Add checklist item"), { target: { value: "Review it" } });
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
});
