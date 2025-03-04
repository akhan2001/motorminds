"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Task {
  id: string
  title: string
  vehicle: string
  date: string
  status: "todo" | "inProgress" | "done"
  statusColor: string
}

interface CalendarViewProps {
  tasks: { [date: string]: Task[] }
  onTaskClick: (task: Task) => void
}

type CalendarViewType = "month" | "week" | "day"

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState<CalendarViewType>("week")

  function goToToday() {
    setCurrentDate(new Date())
  }

  function goBack() {
    const copy = new Date(currentDate)
    if (currentView === "month") copy.setMonth(copy.getMonth() - 1)
    else copy.setDate(copy.getDate() - (currentView === "week" ? 7 : 1))
    setCurrentDate(copy)
  }

  function goNext() {
    const copy = new Date(currentDate)
    if (currentView === "month") copy.setMonth(copy.getMonth() + 1)
    else copy.setDate(copy.getDate() + (currentView === "week" ? 7 : 1))
    setCurrentDate(copy)
  }

  function formatDate(date: Date, type: "short" | "long" = "short") {
    if (type === "long") {
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  function getWeekDays(start: Date) {
    const days = []
    const current = new Date(start)
    current.setDate(current.getDate() - current.getDay())
    for (let i = 0; i < 7; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  function getMonthDays() {
    const days = []
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    const start = new Date(firstDay)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(lastDay)
    end.setDate(end.getDate() + (6 - end.getDay()))
    const c = new Date(start)
    while (c <= end) {
      days.push(new Date(c))
      c.setDate(c.getDate() + 1)
    }
    return days
  }

  function isToday(date: Date) {
    const now = new Date()
    return date.toDateString() === now.toDateString()
  }

  function isSameMonth(date: Date) {
    return date.getMonth() === currentDate.getMonth()
  }

  function getTasksForDate(date: Date) {
    const dateKey = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0]
    return tasks[dateKey] || []
  }

  function renderTaskItem(task: Task, isCompact = false) {
    return (
      <div
        key={task.id}
        onClick={() => onTaskClick(task)}
        className={`bg-[#222222] rounded-lg cursor-pointer ${isCompact ? "p-2" : "p-3"}`}
      >
        {!isCompact && (
          <div className="flex items-center gap-2 text-[#979797] mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{new Date(task.date).toLocaleTimeString()}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.statusColor }} />
          <div className="text-white text-sm font-medium truncate">{task.title}</div>
        </div>
        {!isCompact && <div className="text-[#979797] text-xs mt-1 truncate">{task.vehicle}</div>}
      </div>
    )
  }

  function renderWeekView() {
    const weekDays = getWeekDays(currentDate)
    return (
      <div className="grid grid-cols-7 gap-4 h-[calc(100vh-280px)]">
        {weekDays.map((date, i) => {
          const dateKey = date.toISOString().split("T")[0]
          const dayTasks = tasks[dateKey] || []
          return (
            <div key={i} className="flex flex-col h-full">
              <div className="mb-2 text-center">
                <div className={`text-sm mb-1 ${isToday(date) ? "text-[#b22222]" : "text-[#9d9d9d]"}`}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className={`text-2xl font-bold ${isToday(date) ? "text-[#b22222]" : "text-white"}`}>
                  {date.getDate()}
                </div>
              </div>
              <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                {dayTasks.map((task) => renderTaskItem(task, true))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderMonthView() {
    const days = getMonthDays()
    return (
      <div className="grid grid-cols-7 gap-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-[#9d9d9d] text-sm font-medium text-center">
            {day}
          </div>
        ))}
        {days.map((date, i) => {
          const dayTasks = getTasksForDate(date)
          return (
            <div
              key={i}
              className={`h-[120px] ${isSameMonth(date) ? "bg-[#222222]" : "bg-[#1a1a1a]"} rounded-xl p-2 flex flex-col`}
            >
              <div className={`text-right ${isSameMonth(date) ? "text-white" : "text-[#9d9d9d]"} mb-2`}>
                {date.getDate()}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {dayTasks.map((task) => renderTaskItem(task, true))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderDayView() {
    const dayTasks = getTasksForDate(currentDate)
    return (
      <div className="flex flex-col gap-4 h-[calc(100vh-280px)]">
        <div className="mb-2">
          <div className={`text-sm mb-1 ${isToday(currentDate) ? "text-[#b22222]" : "text-[#9d9d9d]"}`}>
            {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
          </div>
          <div className={`text-4xl font-bold ${isToday(currentDate) ? "text-[#b22222]" : "text-white"}`}>
            {formatDate(currentDate, "long")}
          </div>
        </div>
        <div className="flex-grow overflow-y-auto space-y-4 pr-2">
          {dayTasks.map((task) => renderTaskItem(task))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#151515] text-white">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 bg-[#222222] rounded-full p-1">
          <Button
            variant="ghost"
            className="text-[#b22222] hover:text-[#e23232] hover:bg-transparent px-6 rounded-full"
            onClick={goToToday}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            className="text-white hover:text-white hover:bg-[#2d2d2d] px-6 rounded-full"
            onClick={goBack}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            className="text-white hover:text-white hover:bg-[#2d2d2d] px-6 rounded-full"
            onClick={goNext}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="text-2xl text-white font-medium">
          {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </div>
        <div className="flex gap-2 bg-[#222222] rounded-full p-1">
          <Button
            variant="ghost"
            className={`text-white hover:text-white px-6 rounded-full ${
              currentView === "month" ? "bg-[#2d2d2d]" : "hover:bg-[#2d2d2d]"
            }`}
            onClick={() => setCurrentView("month")}
          >
            Month
          </Button>
          <Button
            variant="ghost"
            className={`text-white hover:text-white px-6 rounded-full ${
              currentView === "week" ? "bg-[#2d2d2d]" : "hover:bg-[#2d2d2d]"
            }`}
            onClick={() => setCurrentView("week")}
          >
            Week
          </Button>
          <Button
            variant="ghost"
            className={`text-white hover:text-white px-6 rounded-full ${
              currentView === "day" ? "bg-[#2d2d2d]" : "hover:bg-[#2d2d2d]"
            }`}
            onClick={() => setCurrentView("day")}
          >
            Day
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {currentView === "month" && renderMonthView()}
        {currentView === "week" && renderWeekView()}
        {currentView === "day" && renderDayView()}
      </div>
    </div>
  )
}
