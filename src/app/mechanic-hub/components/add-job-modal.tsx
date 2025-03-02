"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Task } from "./task-board"
import { motion, AnimatePresence } from "framer-motion"

interface AddJobModalProps {
  isOpen: boolean
  onClose: () => void
  onAddJob: (newJob: Task) => void
}

export function AddJobModal({ isOpen, onClose, onAddJob }: AddJobModalProps) {
  const [title, setTitle] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [date, setDate] = useState("")
  const [status, setStatus] = useState<"red" | "yellow" | "green">("red")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newJob: Task = {
      id: Date.now().toString(),
      title,
      vehicle,
      date,
      status,
      column: status === "red" ? "todo" : status === "yellow" ? "inProgress" : "done",
    }
    onAddJob(newJob)
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setTitle("")
    setVehicle("")
    setDate("")
    setStatus("red")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="bg-[#222222] text-white border-[#2d2d2d]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Add New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Job Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#2d2d2d] border-[#373737] text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicle" className="text-white">
                    Vehicle
                  </Label>
                  <Input
                    id="vehicle"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="bg-[#2d2d2d] border-[#373737] text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date" className="text-white">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-[#2d2d2d] border-[#373737] text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-white">
                    Status
                  </Label>
                  <Select value={status} onValueChange={(value: "red" | "yellow" | "green") => setStatus(value)}>
                    <SelectTrigger className="bg-[#2d2d2d] border-[#373737] text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d2d2d] border-[#373737] text-white">
                      <SelectItem value="red">To Do</SelectItem>
                      <SelectItem value="yellow">In Progress</SelectItem>
                      <SelectItem value="green">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[#b22222] hover:bg-[#e23232] text-white transition-colors duration-200"
                  >
                    Add Job
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}

