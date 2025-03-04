"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TasksTable } from "@/components/tasks-table"
import { TaskStats } from "@/components/task-stats"
import { Plus } from "lucide-react"
import { WorkOrderForm } from "@/components/work-order-form"
import { TaskDetailsModal } from "@/components/task-details-modal"
import { supabase } from "@/lib/supabase"

interface Task {
  id: string
  title: string
  vehicle: string
  date: string
  status: "todo" | "inProgress" | "done"
  assignee?: string
  difficulty?: string
  comments?: string
}

interface TaskListViewProps {
  tasks: Task[]
}

/** 
 * Maps local statuses => DB statuses 
 * e.g. "todo" => "Pending", "inProgress" => "In Progress", "done" => "Completed"
 */
function localStatusToDb(local: "todo" | "inProgress" | "done"): string {
  switch (local) {
    case "todo":
      return "Pending"
    case "inProgress":
      return "In Progress"
    case "done":
      return "Completed"
  }
}

/** 
 * Maps DB statuses => local statuses 
 * e.g. "Pending" => "todo", "In Progress" => "inProgress", "Completed" => "done"
 */
function dbStatusToLocal(dbStatus: string): "todo" | "inProgress" | "done" {
  if (dbStatus === "In Progress") return "inProgress"
  if (dbStatus === "Completed") return "done"
  return "todo"
}

export function TaskListView({ tasks }: TaskListViewProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  /**
   * Insert a new row in the DB 
   * We map local "todo|inProgress|done" => DB "Pending|In Progress|Completed"
   * Store 'title' in, for example, repair_order_details.description 
   * If your DB truly has "title" and "vehicle" columns in repair_orders, adjust accordingly
   */
  const handleAddTask = async (newTask: Task) => {
    try {
      // Insert into repair_orders:
      // We assume your DB has columns: "status", "created_at", etc.
      // and you'll store the actual "title" in repair_order_details if needed
      const { data, error } = await supabase
        .from("repair_orders")
        .insert({
          // If you have a "status" column in repair_orders:
          status: localStatusToDb(newTask.status),
          // If your DB doesn't have a "title" column in repair_orders,
          // you might skip or put it in repair_order_details
        })
        .select()
        .single()
      if (error) throw error

      // Insert row in repair_order_details for the 'title' if your DB requires
      if (data?.id) {
        await supabase
          .from("repair_order_details")
          .insert({
            repair_order_id: data.id,
            description: newTask.title,
            notes: newTask.comments,
            task_priority: newTask.difficulty,
          })
      }

      const insertedId = data?.id
      const insertedTask: Task = {
        id: insertedId,
        title: newTask.title,
        vehicle: newTask.vehicle,
        date: data?.created_at || new Date().toISOString(),
        status: newTask.status, // keep local for UI
        assignee: newTask.assignee,
        difficulty: newTask.difficulty,
        comments: newTask.comments,
      }

      setLocalTasks((prev) => [...prev, insertedTask])
      setIsWorkOrderFormOpen(false)
    } catch (error) {
      console.error("Error adding new task:", error)
    }
  }

  /**
   * Selecting a row
   */
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
  }

  const handleCloseModal = () => {
    setSelectedTask(null)
  }

  /**
   * Update a row in DB
   * We map local => DB status again
   * And if DB doesn't have "title", store it in repair_order_details
   */
  const handleSaveTask = async (updatedTask: Task) => {
    try {
      const dbStatus = localStatusToDb(updatedTask.status)
      // Update repair_orders table
      const { error } = await supabase
        .from("repair_orders")
        .update({
          status: dbStatus,
        })
        .eq("id", updatedTask.id)
      if (error) throw error

      // Also update repair_order_details row
      // You might fetch the existing detail row or assume one already
      // For example:
      const { data: detailData } = await supabase
        .from("repair_order_details")
        .select("id")
        .eq("repair_order_id", updatedTask.id)
        .single()

      if (detailData?.id) {
        await supabase
          .from("repair_order_details")
          .update({
            description: updatedTask.title,
            notes: updatedTask.comments,
            task_priority: updatedTask.difficulty,
          })
          .eq("id", detailData.id)
      }

      // Locally update
      setLocalTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
      setSelectedTask(null)
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 min-h-0 bg-[#151515]">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center gap-2">
          <div className="w-1 h-8 bg-[#b22222]" />
          Task List
        </h1>
      </div>
      <TaskStats tasks={localTasks} />
      <div className="mt-8 bg-[#1A1A1A] rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">All Tasks</h2>
          <Button
            className="bg-[#b22222] hover:bg-[#e23232] text-white"
            onClick={() => setIsWorkOrderFormOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" /> ADD NEW TASK
          </Button>
        </div>
        <TasksTable tasks={localTasks} onTaskClick={handleTaskClick} />
      </div>
      {isWorkOrderFormOpen && (
        <WorkOrderForm onClose={() => setIsWorkOrderFormOpen(false)} onSave={handleAddTask} />
      )}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
        />
      )}
    </div>
  )
}
