"use client"

import { Clock } from "lucide-react"
import { motion } from "framer-motion"

interface Task {
  id: string
  title: string
  vehicle: string
  date: string
  status: "todo" | "inProgress" | "done"
  statusColor: string
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
  isCompact?: boolean
}

export function TaskCard({ task, onClick, isCompact = false }: TaskCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <div className={`bg-[#222222] rounded-xl overflow-hidden ${isCompact ? "p-2" : "p-3"}`}>
        {!isCompact && (
          <>
            {/* Date */}
            <div className="flex items-center gap-2 text-[#979797] pb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{formatDate(task.date)}</span>
            </div>

            {/* Horizontal Line */}
            <div className="h-[1px] bg-[#333333] mb-2" />
          </>
        )}

        {/* Task Content */}
        <div className={`space-y-1 ${isCompact ? "text-xs" : "text-sm"}`}>
          {/* Task Title and Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.statusColor }} />
            <h3 className="text-white font-medium truncate">{task.title}</h3>
          </div>

          {/* Vehicle Info */}
          {!isCompact && <p className="text-[#979797] truncate">{task.vehicle}</p>}
        </div>
      </div>
    </motion.div>
  )
}

