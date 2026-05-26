"use client";

import { IconAlertCircle } from "@tabler/icons-react";
import type { MemberWithUserOutput } from "@/entities/member";
import type { TaskOutput } from "@/entities/task";
import {
  Alert,
  AlertDescription,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared";
import { useTaskSheetController } from "../model";
import { ChecklistSection } from "./checklist-section";
import { TaskSheetDetailsFields } from "./task-sheet-details-fields";
import { TaskSheetFooter } from "./task-sheet-footer";
import { TaskTagSection } from "./task-tag-section";
import { TransferSection } from "./transfer-section";

type Props = {
  columnId?: string;
  members: MemberWithUserOutput[];
  onCreated?: (task: TaskOutput) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
  task: TaskOutput | null;
};

export const TaskSheet = ({ columnId = "", members, onCreated, onOpenChange, open, projectId, task }: Props) => {
  const sheet = useTaskSheetController({ columnId, members, onCreated, onOpenChange, open, projectId, task });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-[min(100vw,44rem)] gap-0 overflow-hidden sm:!max-w-[44rem]" showCloseButton>
        <SheetHeader className="border-b px-4 py-3 pr-12">
          <SheetTitle>{sheet.isCreateMode ? "Create task" : "Task details"}</SheetTitle>
          <SheetDescription>
            {sheet.isCreateMode
              ? "Add the core details, tags, and checklist in one pass."
              : "Edit the task details, tags, and checklist."}
          </SheetDescription>
        </SheetHeader>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={sheet.createOrUpdateTask}>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {sheet.error ? (
              <Alert variant="destructive" className="mb-4">
                <IconAlertCircle className="h-4 w-4" />
                <AlertDescription>{sheet.error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-4">
              <TaskSheetDetailsFields
                assigneeId={sheet.assigneeId}
                description={sheet.description}
                dueDate={sheet.dueDate}
                estimate={sheet.estimate}
                kind={sheet.kind}
                members={members}
                priority={sheet.priority}
                setAssigneeId={sheet.setAssigneeId}
                setDescription={sheet.setDescription}
                setDueDate={sheet.setDueDate}
                setEstimate={sheet.setEstimate}
                setKind={sheet.setKind}
                setPriority={sheet.setPriority}
                setTitle={sheet.setTitle}
                title={sheet.title}
              />

              <TaskTagSection
                addTag={sheet.addTag}
                attachedTagIds={sheet.attachedTagIds}
                deleteProjectTag={sheet.deleteProjectTag}
                isCreateMode={sheet.isCreateMode}
                newTagColor={sheet.newTagColor}
                newTagName={sheet.newTagName}
                projectTags={sheet.projectTags}
                selectedTagIds={sheet.selectedTagIds}
                selectedTagsCount={sheet.selectedTags.length}
                setNewTagColor={sheet.setNewTagColor}
                setNewTagName={sheet.setNewTagName}
                toggleTag={sheet.toggleTag}
              />

              <ChecklistSection
                addItem={sheet.addItem}
                completion={sheet.completion}
                deleteDraftItem={sheet.deleteDraftItem}
                deletePersistedItem={sheet.deletePersistedItem}
                doneCount={sheet.doneCount}
                draftItems={sheet.draftItems}
                isCreateMode={sheet.isCreateMode}
                items={sheet.items}
                moveDraftItem={sheet.moveDraftItem}
                movePersistedItem={sheet.movePersistedItem}
                newItemTitle={sheet.newItemTitle}
                setNewItemTitle={sheet.setNewItemTitle}
                updateDraftItem={sheet.updateDraftItem}
                updatePersistedItem={sheet.updatePersistedItem}
              />

              {!sheet.isCreateMode ? (
                <TransferSection
                  pending={sheet.pending}
                  setTargetBoardId={sheet.setTargetBoardId}
                  setTargetColumnId={sheet.setTargetColumnId}
                  setTargetProjectId={sheet.setTargetProjectId}
                  targetBoardId={sheet.targetBoardId}
                  targetBoards={sheet.targetBoards}
                  targetColumnId={sheet.targetColumnId}
                  targetColumns={sheet.targetColumns}
                  targetProjectId={sheet.targetProjectId}
                  transferCurrentTask={sheet.transferCurrentTask}
                  transferTargetProjects={sheet.transferTargetProjects}
                />
              ) : null}
            </div>
          </div>

          <Separator />

          <TaskSheetFooter
            isCreateMode={sheet.isCreateMode}
            onOpenChange={onOpenChange}
            pending={sheet.pending}
            title={sheet.title}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
};
