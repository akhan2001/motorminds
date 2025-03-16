"use client"

import React, { createContext, useContext, useState } from "react"

// Example Task type – adapt as needed
export interface Task {
  id: string
  title: string
  assignedTo?: string
  time?: string
  status: "Pending" | "In Progress" | "Completed"
  difficulty?: string
  vehicle?: string
  comments?: string
}

interface TasksContextType {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
}

// Default value is an empty list + a no-op for setTasks
const TasksContext = createContext<TasksContextType>({
  tasks: [],
  setTasks: () => {},
})

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  return (
    <TasksContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TasksContext.Provider>
  )
}

// Convenience hook
export function useTasks() {
  return useContext(TasksContext)
}
