"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  assignedTo?: string
  status: "Pending" | "In Progress" | "Completed"
  difficulty?: string
  vehicle?: string
  comments?: string
}

interface TaskStatsProps {
  tasks: Task[]
  currentFilter: "all" | "Pending" | "In Progress" | "Completed"
  onFilterChange?: (filter: "all" | "Pending" | "In Progress" | "Completed") => void
}

export function TaskStats({
  tasks,
  currentFilter,
  onFilterChange
}: TaskStatsProps) {
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === "Completed").length
  const pendingTasks = tasks.filter((t) => t.status === "Pending").length
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length

  // Reuse your original text sizes: 
  // Title => text-sm font-medium
  // Number => text-2xl font-bold
  // Sub-label => text-xs
  // We just change the bg color conditionally.
  
  function getCardClasses(isSelected: boolean) {
    return isSelected
      ? "bg-[#1A1A1A] border-[#2D2D2D] cursor-pointer" // selected
      : "bg-black border-black cursor-pointer"          // unselected
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* ALL TASKS */}
      <Card
        className={getCardClasses(currentFilter === "all")}
        onClick={() => onFilterChange?.("all")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalTasks}</div>
          <p className="text-xs text-[#9d9d9d]">Active Tasks</p>
        </CardContent>
      </Card>

      {/* COMPLETED */}
      <Card
        className={getCardClasses(currentFilter === "Completed")}
        onClick={() => onFilterChange?.("Completed")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Completed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{completedTasks}</div>
          <p className="text-xs text-[#9d9d9d]">Done</p>
        </CardContent>
      </Card>

      {/* PENDING */}
      <Card
        className={getCardClasses(currentFilter === "Pending")}
        onClick={() => onFilterChange?.("Pending")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{pendingTasks}</div>
          <p className="text-xs text-[#9d9d9d]">To Do</p>
        </CardContent>
      </Card>

      {/* IN PROGRESS */}
      <Card
        className={getCardClasses(currentFilter === "In Progress")}
        onClick={() => onFilterChange?.("In Progress")}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{inProgressTasks}</div>
          <p className="text-xs text-[#9d9d9d]">Currently Working</p>
        </CardContent>
      </Card>
    </div>
  )
}
