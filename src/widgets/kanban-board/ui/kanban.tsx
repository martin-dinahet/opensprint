import { KanbanColumn, KanbanColumnView, KanbanTaskCard } from "./kanban-column-view";
import { KanbanColumns, KanbanRoot } from "./kanban-root";
import { KanbanOverlay } from "./kanban-overlay";

export { KanbanColumnView };

export const Kanban = {
  Column: KanbanColumn,
  Columns: KanbanColumns,
  Overlay: KanbanOverlay,
  Root: KanbanRoot,
  TaskCard: KanbanTaskCard,
};
