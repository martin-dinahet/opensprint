import { KanbanColumn, KanbanColumnView, KanbanTaskCard } from "./kanban-column-view";
import { KanbanOverlay } from "./kanban-overlay";
import { KanbanColumns, KanbanRoot } from "./kanban-root";

export { KanbanColumnView };

export const Kanban = {
  Column: KanbanColumn,
  Columns: KanbanColumns,
  Overlay: KanbanOverlay,
  Root: KanbanRoot,
  TaskCard: KanbanTaskCard,
};
