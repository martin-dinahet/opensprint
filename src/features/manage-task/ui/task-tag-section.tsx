import { IconPlus, IconTag, IconX } from "@tabler/icons-react";
import type { ProjectTaskTagOutput } from "@/entities/task";
import { taskTagPalette } from "@/entities/task/lib";
import { Button, cn, Input } from "@/shared";

type Props = {
  attachedTagIds: Set<string>;
  deleteProjectTag: (tag: ProjectTaskTagOutput) => void;
  isCreateMode: boolean;
  newTagColor: string;
  newTagName: string;
  projectTags: ProjectTaskTagOutput[];
  selectedTagIds: Set<string>;
  selectedTagsCount: number;
  setNewTagColor: (color: string) => void;
  setNewTagName: (name: string) => void;
  toggleTag: (tagId: string) => void;
  addTag: () => void;
};

export function TaskTagSection({
  addTag,
  attachedTagIds,
  deleteProjectTag,
  isCreateMode,
  newTagColor,
  newTagName,
  projectTags,
  selectedTagIds,
  selectedTagsCount,
  setNewTagColor,
  setNewTagName,
  toggleTag,
}: Props) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-medium text-sm">
            <IconTag className="h-4 w-4 text-muted-foreground" />
            Tags
          </h3>
          <p className="text-muted-foreground text-xs">
            {isCreateMode && selectedTagsCount > 0 ? `${selectedTagsCount} selected` : "Reusable project labels"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {projectTags.map((tag) => {
          const selected = isCreateMode ? selectedTagIds.has(tag.id) : attachedTagIds.has(tag.id);

          return (
            <span
              key={tag.id}
              className={cn(
                "group inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors",
                selected
                  ? "border-primary/30 bg-primary/10 text-foreground font-medium shadow-xs"
                  : "border-border text-muted-foreground hover:border-muted-foreground/30",
              )}
            >
              <button
                type="button"
                aria-label={tag.name}
                className="inline-flex min-w-0 flex-1 items-center gap-1.5"
                onClick={() => toggleTag(tag.id)}
              >
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="truncate">{tag.name}</span>
              </button>
              <button
                type="button"
                className="ml-0.5 inline-flex size-3.5 cursor-pointer items-center justify-center rounded-full text-muted-foreground/50 hover:text-foreground"
                onClick={() => deleteProjectTag(tag)}
              >
                <IconX className="h-2.5 w-2.5" />
                <span className="sr-only">Delete tag</span>
              </button>
            </span>
          );
        })}
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <Input
          placeholder="New tag…"
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void addTag();
            }
          }}
        />
        <div className="flex items-center gap-1 rounded-md border px-2 py-1">
          {taskTagPalette.map((color) => (
            <button
              key={color}
              type="button"
              className={cn("size-4 rounded-full ring-offset-2", newTagColor === color && "ring-2 ring-ring")}
              style={{ backgroundColor: color }}
              onClick={() => setNewTagColor(color)}
            >
              <span className="sr-only">Choose tag color</span>
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addTag} disabled={!newTagName.trim()}>
          <IconPlus className="h-4 w-4" />
          Tag
        </Button>
      </div>
    </section>
  );
}
