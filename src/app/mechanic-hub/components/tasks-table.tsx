"use client"

import React from "react"

interface Task {
  id: string
  title: string
  assignedTo?: string
  time?: string
  status: "Pending" | "In Progress" | "Completed"
  difficulty?: string
  vehicle?: string
  comments?: string
}

interface TasksTableProps {
  tasks?: Task[]  // can be undefined, we’ll default to []
  onTaskClick?: (task: Task) => void
}

export function TasksTable({ tasks = [], onTaskClick }: TasksTableProps) {
  // Optionally, color-code statuses:
  function getStatusClass(status: string) {
    if (status === "Pending") return "text-yellow-500"
    if (status === "In Progress") return "text-blue-500"
    if (status === "Completed") return "text-green-500"
    return "text-white"
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-[#2D2D2D]">
          <th className="py-3 px-4 text-[#9d9d9d]">Task Name</th>
          <th className="py-3 px-4 text-[#9d9d9d]">Assigned To</th>
          <th className="py-3 px-4 text-[#9d9d9d]">Time</th>
          <th className="py-3 px-4 text-[#9d9d9d]">Status</th>
          <th className="py-3 px-4 text-[#9d9d9d]">Difficulty</th>
          <th className="py-3 px-4 text-[#9d9d9d]">Vehicle</th>
          <th className="py-3 px-4 text-[#9d9d9d]">Comments</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="cursor-pointer hover:bg-[#252525] transition-colors"
          >
            <td className="py-3 px-4 text-white whitespace-nowrap">
              {task.title}
            </td>
            <td className="py-3 px-4 text-[#9d9d9d] whitespace-nowrap">
              {task.assignedTo || "Unassigned"}
            </td>
            <td className="py-3 px-4 text-[#9d9d9d] whitespace-nowrap">
              {task.time || "--"}
            </td>
            <td className={`py-3 px-4 whitespace-nowrap font-semibold ${getStatusClass(task.status)}`}>
              {task.status}
            </td>
            <td className="py-3 px-4 text-[#9d9d9d] whitespace-nowrap">
              {task.difficulty || "--"}
            </td>
            <td className="py-3 px-4 text-[#9d9d9d] whitespace-nowrap">
              {task.vehicle || "--"}
            </td>
            <td className="py-3 px-4 text-[#9d9d9d] whitespace-nowrap">
              {task.comments || "--"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
