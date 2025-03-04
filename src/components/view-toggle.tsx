"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { List } from "lucide-react"
import Link from "next/link"

interface ViewToggleProps {
  onViewChange: (view: "board" | "calendar") => void
}

export function ViewToggle({ onViewChange }: ViewToggleProps) {
  const [activeView, setActiveView] = useState<"board" | "calendar">("board")

  const handleViewChange = (view: "board" | "calendar") => {
    setActiveView(view)
    onViewChange(view)
  }

  return (
    <div className="flex items-center gap-4">
      <motion.div
        className="bg-[#222222] p-1 rounded-full inline-flex"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.button
          onClick={() => handleViewChange("board")}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-colors",
            activeView === "board" ? "bg-[#2D2D2D] text-white" : "text-[#9d9d9d] hover:text-white",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          BOARD VIEW
        </motion.button>
        <motion.button
          onClick={() => handleViewChange("calendar")}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-colors",
            activeView === "calendar" ? "bg-[#2D2D2D] text-white" : "text-[#9d9d9d] hover:text-white",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          CALENDAR VIEW
        </motion.button>
      </motion.div>
      <Link href="/tasks">
        <motion.button
          className="bg-[#222222] hover:bg-[#333333] text-white rounded-full px-6 py-2.5 h-auto transition-colors duration-200 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <List className="h-5 w-5" />
          VIEW TASKS
        </motion.button>
      </Link>
    </div>
  )
}

