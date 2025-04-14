"use client"

import React, { useState, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable"
import { TaskColumn } from "./task-column"
import { TaskCard } from "./task-card"
import { supabase } from "@/lib/supabase"

// ----- Your Task interface -----
export interface Task {
  id: string
  title: string
  status: "todo" | "inProgress" | "done"
  statusColor: string
  [key: string]: any
}

interface TaskBoardProps {
  tasks?: {
    todo: Task[]
    inProgress: Task[]
    done: Task[]
  }
  onTaskClick: (task: Task) => void
}

// Convert local "todo|inProgress|done" => DB "Pending|In Progress|Completed"
function localStatusToDb(local: "todo" | "inProgress" | "done"): string {
  switch (local) {
    case "todo":
      return "Pending"
    case "inProgress":
      return "In Progress"
    case "done":
      return "Completed"
    default:
      return "Pending"
  }
}

// Map local status to a color
function getStatusColor(status: "todo" | "inProgress" | "done"): string {
  switch (status) {
    case "todo":
      return "#e23232"
    case "inProgress":
      return "#d6cd24"
    case "done":
      return "#1eb386"
    default:
      return "#e23232"
  }
}

export function TaskBoard({
  tasks = { todo: [], inProgress: [], done: [] },
  onTaskClick,
}: TaskBoardProps) {
  // Local columns for instant reorder
  const [columns, setColumns] = useState(tasks)

  // Sync local columns if parent tasks prop changes
  useEffect(() => {
    setColumns(tasks)
  }, [tasks])

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [activeId, setActiveId] = useState<string | null>(null)

  function findTaskAll(taskId: string): Task | undefined {
    return [...columns.todo, ...columns.inProgress, ...columns.done].find(
      (t) => t.id === taskId
    )
  }

  // Reorder items within the same column
  function reorderTaskWithinSameColumn(
    taskId: string,
    overId: string,
    columnKey: "todo" | "inProgress" | "done"
  ) {
    setColumns((prev) => {
      const columnArray = prev[columnKey]
      const oldIndex = columnArray.findIndex((t) => t.id === taskId)
      const newIndex = columnArray.findIndex((t) => t.id === overId)
      if (oldIndex < 0 || newIndex < 0) return prev // do nothing if we can't find an index

      const newTasks = arrayMove(columnArray, oldIndex, newIndex)
      return {
        ...prev,
        [columnKey]: newTasks,
      }
    })
  }

  function handleDragStart(event: any) {
    setActiveId(event.active.id as string)
  }


  function handleDragMove(event: DragMoveEvent) {
    // If there's no "over" container, do nothing
    if (!event.over) return

    // We'll check if we are over a "column-XYZ" droppable, and if so, scroll it
    const overId = event.over.id as string
    if (!overId.startsWith("column-")) {
      return
    }

    // Get the DOM node for that column
    const droppableColumn = document.getElementById(overId)
    if (!droppableColumn) return

    // The container that actually scrolls is the <div> with overflow-y-auto inside your column
    // Let's find that child by a class or querySelector
    const scrollable = droppableColumn.querySelector(".scrollableColumn") as HTMLElement
    if (!scrollable) return

    // We'll measure the pointer's position relative to the scroll container
    const { offsetTop, offsetHeight } = scrollable
    // The pointer is in event.delta or event.active
    const pointerY = event.activatorEvent instanceof MouseEvent
      ? event.activatorEvent.clientY
      : null

    if (!pointerY) return

    // We can also measure the container's bounding rect
    const rect = scrollable.getBoundingClientRect()
    const topEdge = rect.top
    const bottomEdge = rect.bottom

    const SCROLL_ZONE = 50 // how many px from top/bottom to start scrolling
    const SCROLL_SPEED = 10 // adjust as needed

    // If near the top
    if (pointerY - topEdge < SCROLL_ZONE) {
      scrollable.scrollBy({ top: -SCROLL_SPEED, behavior: "auto" })
    }
    // If near the bottom
    else if (bottomEdge - pointerY < SCROLL_ZONE) {
      scrollable.scrollBy({ top: SCROLL_SPEED, behavior: "auto" })
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) {
      setActiveId(null)
      return
    }

    const currentTask = findTaskAll(active.id)
    if (!currentTask) {
      setActiveId(null)
      return
    }

    // If you dropped on a "column-xxx" or not
    const overId = over.id as string
    const overColumn = overId.includes("column-")
      ? (overId.replace("column-", "") as "todo" | "inProgress" | "done")
      : currentTask.status

    // If same column => reorder
    if (overColumn === currentTask.status) {
      if (overId !== active.id) {
        reorderTaskWithinSameColumn(active.id, overId, currentTask.status)
      }
      setActiveId(null)
      return
    }

    // Otherwise, you're dropping into a different column => move
    setColumns((prev) => ({
      ...prev,
      [currentTask.status]: prev[currentTask.status].filter(
        (t) => t.id !== currentTask.id
      ),
      [overColumn]: [
        ...prev[overColumn],
        {
          ...currentTask,
          status: overColumn,
          statusColor: getStatusColor(overColumn),
        },
      ],
    }))

    // Also update DB if you want to reflect the new status
    const dbStatus = localStatusToDb(overColumn)
    try {
      const { error } = await supabase
        .from("repair_orders")
        .update({ status: dbStatus })
        .eq("id", active.id)
      if (error) {
        console.error("Error updating task status:", error)
      }
    } catch (err) {
      console.error("Error updating task status:", err)
    }

    setActiveId(null)
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      // 1) Add onDragMove => auto-scroll
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-8">
        <TaskColumn
          id="column-todo"
          title="To-Do"
          icon="grid"
          tasks={columns.todo}
          onTaskClick={onTaskClick}
        />
        <TaskColumn
          id="column-inProgress"
          title="In Progress"
          icon="clock"
          tasks={columns.inProgress}
          onTaskClick={onTaskClick}
        />
        <TaskColumn
          id="column-done"
          title="Done"
          icon="check"
          tasks={columns.done}
          onTaskClick={onTaskClick}
        />
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="transform rotate-3 opacity-80">
            <TaskCard
              task={findTaskAll(activeId)!}
              onClick={() => {
                const t = findTaskAll(activeId!)
                if (t) {
                  onTaskClick(t)
                }
              }}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
