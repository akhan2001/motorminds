"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { TasksTable } from "@/components/tasks-table"
import { TaskStats } from "@/components/task-stats"

// Minimal 'Task' interface for our UI
interface Task {
  id: string
  title: string
  assignedTo: string  // The staff name
  status: "Pending" | "In Progress" | "Completed"
  date?: string
  difficulty?: string
  comments?: string
}

export function TaskListView() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      setIsLoading(true)

      // 1) SELECT from `repair_orders`, join on `repair_order_details`, which in turn joins `shop_staff`
      const { data, error } = await supabase
        .from("repair_orders")
        .select(`
          id,
          status,
          created_at,
          repair_order_details(
            description,
            mechanic_id,
            notes,
            task_priority,
            shop_staff(*)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching tasks:", error)
        setTasks([])
        setIsLoading(false)
        return
      }
      if (!data) {
        setTasks([])
        setIsLoading(false)
        return
      }

      // 2) Transform each row => minimal 'Task'
      const transformed: Task[] = data.map((row: any) => {
        const detail = row.repair_order_details?.[0] || {}
        // staff_name from the joined `shop_staff(*)
        const staffName = detail.shop_staff?.staff_name || "Unassigned"
        console.log(staffName)
        return {
          id: row.id,
          title: detail.description || "Untitled",
          assignedTo: staffName,
          status: (row.status as Task["status"]) || "Pending",
          date: row.created_at,
          difficulty: detail.task_priority || "",
          comments: detail.notes || ""
        }
      })

      setTasks(transformed)
    } catch (err) {
      console.error("Unexpected error fetching tasks:", err)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-white">Loading tasks...</div>
  }

  return (
    <div className="p-6 bg-black min-h-screen flex flex-col">
      <h1 className="text-4xl font-bold text-white mb-6">Task List View</h1>

      {/* Show stats for these tasks */}
      <TaskStats tasks={tasks} />

      <div className="mt-6 bg-[#1A1A1A] rounded-xl p-4 flex-1">
        <TasksTable tasks={tasks} />
      </div>
    </div>
  )
}
