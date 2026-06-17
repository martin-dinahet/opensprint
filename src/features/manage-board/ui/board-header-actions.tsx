"use client";

import { IconChevronDown, IconDotsVertical, IconEdit, IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import z from "zod";
import type { BoardOutput } from "@/entities/board";
import { useCreateBoard, useUpdateBoard } from "@/entities/board";
import { ProjectTabs } from "@/features/project-tabs";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  parseFormData,
} from "@/shared";

const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(130),
});

type ProjectBoardHeaderActionsProps = {
  activeBoardId: string;
  activeBoardName: string;
  boards: BoardOutput[];
  projectId: string;
};

export function ProjectBoardHeaderActions({
  activeBoardId,
  activeBoardName,
  boards,
  projectId,
}: ProjectBoardHeaderActionsProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ProjectTabs activeTab="board" boardId={activeBoardId} projectId={projectId} />
      <BoardActions
        activeBoardId={activeBoardId}
        activeBoardName={activeBoardName}
        boards={boards}
        projectId={projectId}
      />
    </div>
  );
}

function BoardActions({ activeBoardId, activeBoardName, boards, projectId }: ProjectBoardHeaderActionsProps) {
  const createBoard = useCreateBoard(projectId);
  const updateBoard = useUpdateBoard(projectId);
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const resetErrors = () => {
    setFieldErrors(null);
    setGlobalError(null);
  };

  const addBoard = (formData: FormData) => {
    startTransition(async () => {
      resetErrors();

      const parsed = parseFormData(createBoardSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      try {
        const board = await createBoard.mutateAsync(parsed.data);
        setAddOpen(false);
        router.push(`/projects/${projectId}/boards/${board.id}`);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to create board");
      }
    });
  };

  const renameBoard = (formData: FormData) => {
    startTransition(async () => {
      resetErrors();

      const parsed = parseFormData(createBoardSchema, formData);
      if (parsed.fieldErrors) {
        setFieldErrors(parsed.fieldErrors);
        return;
      }

      try {
        await updateBoard.mutateAsync({ boardId: activeBoardId, data: parsed.data });
        setRenameOpen(false);
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "Unable to rename board");
      }
    });
  };

  return (
    <>
      <BoardSwitcher
        activeBoardId={activeBoardId}
        activeBoardName={activeBoardName}
        boards={boards}
        onAddBoard={() => setAddOpen(true)}
        projectId={projectId}
      />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button aria-label="Board actions" variant="outline" size="icon-sm" />}>
          <IconDotsVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Board actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <IconEdit />
              Rename Board
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddOpen(true)}>
              <IconPlus />
              Add Board
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <BoardFormDialog
        description="Create another board in this project."
        fieldErrors={fieldErrors}
        globalError={globalError}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetErrors();
          setAddOpen(nextOpen);
        }}
        onSubmit={addBoard}
        open={addOpen}
        pending={pending || createBoard.isPending}
        submitLabel="Add Board"
        title="Add Board"
        variant="add"
      />

      <BoardFormDialog
        defaultName={activeBoardName}
        description="Update the board name shown in this project."
        fieldErrors={fieldErrors}
        globalError={globalError}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetErrors();
          setRenameOpen(nextOpen);
        }}
        onSubmit={renameBoard}
        open={renameOpen}
        pending={pending || updateBoard.isPending}
        submitLabel="Rename Board"
        title="Rename Board"
        variant="rename"
      />
    </>
  );
}

function BoardFormDialog({
  defaultName,
  description,
  fieldErrors,
  globalError,
  onOpenChange,
  onSubmit,
  open,
  pending,
  submitLabel,
  title,
  variant,
}: {
  defaultName?: string;
  description: string;
  fieldErrors: Record<string, string[]> | null;
  globalError: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: FormData) => void;
  open: boolean;
  pending: boolean;
  submitLabel: string;
  title: string;
  variant: "add" | "rename";
}) {
  const Icon = variant === "rename" ? IconEdit : IconPlus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={onSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field data-invalid={!!fieldErrors?.name}>
              <FieldLabel htmlFor={`${title.replaceAll(" ", "-").toLowerCase()}-name`}>Name</FieldLabel>
              <Input
                id={`${title.replaceAll(" ", "-").toLowerCase()}-name`}
                name="name"
                defaultValue={defaultName}
                placeholder="Roadmap…"
                autoComplete="off"
                disabled={pending}
              />
              <FieldError>{fieldErrors?.name?.[0] ?? globalError}</FieldError>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              <Icon className="h-4 w-4" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BoardSwitcher({
  activeBoardId,
  activeBoardName,
  boards,
  onAddBoard,
  projectId,
}: ProjectBoardHeaderActionsProps & {
  onAddBoard: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boardCount = boards.length || 1;

  const switchBoard = (boardId: string) => {
    setOpen(false);
    if (boardId !== activeBoardId) {
      router.push(`/projects/${projectId}/boards/${boardId}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button className="max-w-[13rem] justify-start gap-2 px-2 sm:max-w-[18rem]" size="sm" variant="outline" />
        }
      >
        <IconLayoutKanban className="size-3.5 text-muted-foreground" />
        <span className="min-w-0 truncate">{activeBoardName}</span>
        <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground tabular-nums">
          {boardCount}
        </span>
        <IconChevronDown className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-1.5rem))] gap-2 p-2">
        <PopoverHeader className="px-2 pt-1">
          <PopoverTitle>Boards</PopoverTitle>
        </PopoverHeader>
        <Command>
          <CommandInput placeholder="Find a board..." />
          <CommandList>
            <CommandEmpty>No boards found.</CommandEmpty>
            <CommandGroup>
              {boards.map((board) => (
                <CommandItem
                  data-checked={board.id === activeBoardId}
                  key={board.id}
                  onSelect={() => switchBoard(board.id)}
                  value={board.name}
                >
                  <IconLayoutKanban className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{board.name}</span>
                  {board.id === activeBoardId ? <span className="text-muted-foreground text-xs">Current</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  onAddBoard();
                }}
                value="add board"
              >
                <IconPlus className="size-4 text-muted-foreground" />
                <span>Add board</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
