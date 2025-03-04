import { Check, Clock } from "lucide-react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { SortableTaskCard } from "./sortable-task-card"
import type { Task } from "./task-board"

interface TaskColumnProps {
  id: string
  title: string
  icon: "grid" | "clock" | "check"
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function TaskColumn({ id, title, icon, tasks, onTaskClick }: TaskColumnProps) {
  // 1) Make this column droppable by calling useDroppable with our id
  const { setNodeRef } = useDroppable({ id })

  return (
    // 2) Attach the droppable ref to the OUTER container so the whole column can accept drops
    <div ref={setNodeRef} className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        {icon === "grid" ? (
          <div className="grid place-items-center">
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-white" />
              ))}
            </div>
          </div>
        ) : icon === "clock" ? (
          <Clock className="h-5 w-5 text-white" />
        ) : (
          <Check className="h-5 w-5 text-white" />
        )}
        <h2 className="text-white text-lg font-medium">{title}</h2>
      </div>

      {/* Sortable context remains the same, just remove the ref here */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden pr-2">
          <div className="space-y-3">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task)}
              />
            ))}
          </div>
        </div>
      </SortableContext>
    </div>
  )
}
