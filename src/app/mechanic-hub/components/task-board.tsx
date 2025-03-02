"use client"

import React, { useState, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  rectIntersection, // <-- CHANGED
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { TaskColumn } from "./task-column"
import { TaskCard } from "./task-card"
import { supabase } from "@/lib/supabase"
import type { Task } from "./task-column"

interface TaskBoardProps {
  tasks?: {
    todo: Task[]
    inProgress: Task[]
    done: Task[]
  }
  onTaskClick: (task: Task) => void
}

/** Convert local "todo|inProgress|done" => DB "Pending|In Progress|Completed" */
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

/** Optional helper: map local status to a color */
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

  // Sync local columns if the parent tasks prop changes
  useEffect(() => {
    setColumns(tasks)
  }, [tasks])

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

  function handleDragStart(event: any) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    console.log("DRAG END: from:", active.id, " => over:", over?.id || "none") 
    if (!over) return

    const overId = over.id as string
    const overColumn = overId.includes("column-")
      ? (overId.replace("column-", "") as "todo" | "inProgress" | "done")
      : null

    const currentTask = findTaskAll(active.id)
    if (overColumn && currentTask && currentTask.status !== overColumn) {
      // 1) Update local columns
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

      // 2) Update DB
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
    }

    setActiveId(null)
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      // CHANGE #1: Use rectIntersection instead of closestCorners
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-8">
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
