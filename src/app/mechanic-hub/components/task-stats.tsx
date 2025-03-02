"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTasks } from "@/contexts/tasks-context"

export function TaskStats() {
  const { tasks } = useTasks()

  // Calculate current stats by looking at the DB status
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "Completed").length
  const pendingTasks = tasks.filter((task) => task.status === "Pending").length
  const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length

  // Debug logging
  console.log("Tasks status breakdown:", {
    total: totalTasks,
    completed: completedTasks,
    pending: pendingTasks,
    inProgress: inProgressTasks,
    tasks: tasks.map((t) => ({
      id: t.id,
      status: t.status,
      // any other fields for debugging...
    })),
  })

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Total Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{totalTasks}</div>
          <p className="text-xs text-[#9d9d9d]">Active Tasks</p>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Completed Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{completedTasks}</div>
          <p className="text-xs text-[#9d9d9d]">Done</p>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white">Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{pendingTasks}</div>
          <p className="text-xs text-[#9d9d9d]">To Do</p>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
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
