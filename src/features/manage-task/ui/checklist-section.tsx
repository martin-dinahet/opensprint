import { IconArrowDown, IconArrowUp, IconListCheck, IconPlus, IconTrash } from "@tabler/icons-react";
import type { TaskItemOutput } from "@/entities/task";
import { Button, cn, Badge, Input } from "@/shared";
import type { DraftItem } from "../model";

type Props = {
  addItem: () => void;
  completion: number;
  deleteDraftItem: (itemId: string) => void;
  deletePersistedItem: (itemId: string) => void;
  doneCount: number;
  draftItems: DraftItem[];
  isCreateMode: boolean;
  items: TaskItemOutput[];
  moveDraftItem: (itemId: string, direction: -1 | 1) => void;
  movePersistedItem: (itemId: string, direction: -1 | 1) => void;
  newItemTitle: string;
  setNewItemTitle: (title: string) => void;
  updateDraftItem: (itemId: string, title: string) => void;
  updatePersistedItem: (itemId: string, data: Partial<Pick<TaskItemOutput, "done" | "title">>) => void;
};

export function ChecklistSection({
  addItem,
  completion,
  deleteDraftItem,
  deletePersistedItem,
  doneCount,
  draftItems,
  isCreateMode,
  items,
  moveDraftItem,
  movePersistedItem,
  newItemTitle,
  setNewItemTitle,
  updateDraftItem,
  updatePersistedItem,
}: Props) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-sm">
            <IconListCheck className="h-4 w-4 text-muted-foreground" />
            Checklist
          </h3>
          <p className="text-muted-foreground text-xs">
            {isCreateMode
              ? `${draftItems.length} draft item${draftItems.length === 1 ? "" : "s"}`
              : items.length > 0
                ? `${doneCount}/${items.length} complete`
                : "No items"}
          </p>
        </div>
        {!isCreateMode ? <Badge variant="outline">{completion}%</Badge> : null}
      </div>

      <div className="space-y-2">
        {isCreateMode
          ? draftItems.map((item, index) => (
              <DraftChecklistItem
                key={item.id}
                canMoveDown={index < draftItems.length - 1}
                canMoveUp={index > 0}
                item={item}
                onDelete={() => deleteDraftItem(item.id)}
                onMoveDown={() => moveDraftItem(item.id, 1)}
                onMoveUp={() => moveDraftItem(item.id, -1)}
                onUpdate={(title) => updateDraftItem(item.id, title)}
              />
            ))
          : items.map((item, index) => (
              <PersistedChecklistItem
                key={item.id}
                canMoveDown={index < items.length - 1}
                canMoveUp={index > 0}
                item={item}
                onDelete={() => deletePersistedItem(item.id)}
                onMoveDown={() => movePersistedItem(item.id, 1)}
                onMoveUp={() => movePersistedItem(item.id, -1)}
                onUpdate={updatePersistedItem}
              />
            ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add checklist item…"
          value={newItemTitle}
          onChange={(event) => setNewItemTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addItem();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addItem} disabled={!newItemTitle.trim()}>
          <IconPlus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </section>
  );
}

function PersistedChecklistItem({
  canMoveDown,
  canMoveUp,
  item,
  onDelete,
  onMoveDown,
  onMoveUp,
  onUpdate,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  item: TaskItemOutput;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onUpdate: (itemId: string, data: Partial<Pick<TaskItemOutput, "done" | "title">>) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
      <input
        type="checkbox"
        checked={item.done}
        className="size-4 shrink-0 accent-primary"
        onChange={(event) => onUpdate(item.id, { done: event.target.checked })}
      />
      <Input
        defaultValue={item.title}
        className={cn("h-7 flex-1 border-0 bg-transparent px-1", item.done && "text-muted-foreground line-through")}
        onBlur={(event) => onUpdate(item.id, { title: event.target.value })}
      />
      <ItemActions
        canMoveDown={canMoveDown}
        canMoveUp={canMoveUp}
        onDelete={onDelete}
        onMoveDown={onMoveDown}
        onMoveUp={onMoveUp}
      />
    </div>
  );
}

function DraftChecklistItem({
  canMoveDown,
  canMoveUp,
  item,
  onDelete,
  onMoveDown,
  onMoveUp,
  onUpdate,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  item: DraftItem;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onUpdate: (title: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2">
      <span className="size-4 shrink-0 rounded border border-dashed border-muted-foreground/50" />
      <Input
        value={item.title}
        className="h-7 flex-1 border-0 bg-transparent px-1"
        onChange={(event) => onUpdate(event.target.value)}
      />
      <ItemActions
        canMoveDown={canMoveDown}
        canMoveUp={canMoveUp}
        onDelete={onDelete}
        onMoveDown={onMoveDown}
        onMoveUp={onMoveUp}
      />
    </div>
  );
}

function ItemActions({
  canMoveDown,
  canMoveUp,
  onDelete,
  onMoveDown,
  onMoveUp,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <Button type="button" size="icon-sm" variant="ghost" disabled={!canMoveUp} onClick={onMoveUp}>
        <IconArrowUp className="h-3.5 w-3.5" />
        <span className="sr-only">Move item up</span>
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" disabled={!canMoveDown} onClick={onMoveDown}>
        <IconArrowDown className="h-3.5 w-3.5" />
        <span className="sr-only">Move item down</span>
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" onClick={onDelete}>
        <IconTrash className="h-3.5 w-3.5" />
        <span className="sr-only">Delete item</span>
      </Button>
    </span>
  );
}
