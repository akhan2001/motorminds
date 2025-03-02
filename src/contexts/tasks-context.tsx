"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { Task } from "@/types/task"

interface TasksContextType {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  return <TasksContext.Provider value={{ tasks, setTasks }}>{children}</TasksContext.Provider>
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider")
  }
  return context
}

