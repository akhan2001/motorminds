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
  // Make this column droppable by calling useDroppable with our id
  const { setNodeRef } = useDroppable({ id })

  return (
    // ADDED "min-h-[80vh]" so the column looks taller
    <div
      ref={setNodeRef}
      className="min-h-[80vh] h-full flex flex-col p-4 bg-[#222222]/40 rounded-lg"
    >
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

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {/* Keep your original scrollable task container */}
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
