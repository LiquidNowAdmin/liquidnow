"use client";

// Generischer Kanban-Board, einmal definiert für /admin/anfragen + /admin/antraege.
// Spalten + Kartenrendering werden vom Konsumenten bestimmt; DnD optional via onCardMove.

import { useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor,
  useSensor, useSensors, closestCenter,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

export type KanbanColumn<S extends string> = {
  key: S;
  label: string;
  color?: string;
  icon?: React.ComponentType<{ style?: React.CSSProperties }>;
};

export type KanbanCardEntry<T, S extends string> = {
  id: string;
  column: S;
  data: T;
};

export type KanbanBoardProps<T, S extends string> = {
  columns: KanbanColumn<S>[];
  cards: KanbanCardEntry<T, S>[];
  renderCard: (data: T) => React.ReactNode;
  onCardClick?: (id: string) => void;
  /** Liefert false oder wirft → optimistic-rollback. Nicht gesetzt → DnD aus. */
  onCardMove?: (id: string, toColumn: S) => Promise<boolean>;
  isCardDraggable?: (data: T) => boolean;
  emptyColumnLabel?: string;
};

export function KanbanBoard<T, S extends string>({
  columns, cards, renderCard, onCardClick, onCardMove, isCardDraggable,
  emptyColumnLabel = "Keine",
}: KanbanBoardProps<T, S>) {
  const dndEnabled = !!onCardMove;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Lokale optimistic-State-Overlay über die original-cards.
  const [overrides, setOverrides] = useState<Record<string, S>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const effectiveCards = cards.map((c) => ({
    ...c,
    column: overrides[c.id] ?? c.column,
  }));

  const activeCard = activeId
    ? effectiveCards.find((c) => c.id === activeId) ?? null
    : null;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!onCardMove) return;
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const toColumn = overId as S;
    const card = effectiveCards.find((c) => c.id === id);
    if (!card || card.column === toColumn) return;

    const prevCol = card.column;
    setOverrides((m) => ({ ...m, [id]: toColumn })); // optimistic

    let ok = false;
    try {
      ok = await onCardMove(id, toColumn);
    } catch {
      ok = false;
    }
    if (!ok) {
      setOverrides((m) => ({ ...m, [id]: prevCol })); // rollback
    }
  }

  const board = (
    <div className="kanban-board">
      {columns.map((col) => {
        const colCards = effectiveCards.filter((c) => c.column === col.key);
        const Icon = col.icon;
        return (
          <DroppableColumn
            key={col.key}
            id={col.key}
            label={col.label}
            color={col.color}
            count={colCards.length}
            icon={Icon}
            enabled={dndEnabled}
          >
            {colCards.length === 0 ? (
              <div className="kanban-empty">{emptyColumnLabel}</div>
            ) : (
              colCards.map((card) => {
                const draggable = dndEnabled && (isCardDraggable?.(card.data) ?? true);
                return (
                  <DraggableCard
                    key={card.id}
                    id={card.id}
                    draggable={draggable}
                    onClick={() => onCardClick?.(card.id)}
                  >
                    {renderCard(card.data)}
                  </DraggableCard>
                );
              })
            )}
          </DroppableColumn>
        );
      })}
    </div>
  );

  if (!dndEnabled) return board;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {board}
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="kanban-card" style={{ cursor: "grabbing", boxShadow: "0 8px 24px rgba(36,54,80,0.18)" }}>
            {renderCard(activeCard.data)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({
  id, label, color, count, icon: Icon, enabled, children,
}: {
  id: string;
  label: string;
  color?: string;
  count: number;
  icon?: React.ComponentType<{ style?: React.CSSProperties }>;
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !enabled });
  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={isOver ? { background: "rgba(80,122,166,0.06)", borderRadius: "0.5rem" } : undefined}
    >
      <div className="kanban-column-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {Icon ? <Icon style={{ width: "0.875rem", height: "0.875rem", color: color ?? "var(--color-subtle)" }} /> : null}
          <span className="kanban-column-title">{label}</span>
        </div>
        <span className="kanban-column-count">{count}</span>
      </div>
      <div className="kanban-column-body">{children}</div>
    </div>
  );
}

function DraggableCard({
  id, draggable, onClick, children,
}: {
  id: string;
  draggable: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, disabled: !draggable });

  return (
    <div
      ref={setNodeRef}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      onClick={(e) => {
        if (isDragging) return;
        onClick?.();
        e.stopPropagation();
      }}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: draggable ? "grab" : (onClick ? "pointer" : "default"),
        touchAction: draggable ? "none" : undefined,
      }}
    >
      {children}
    </div>
  );
}
