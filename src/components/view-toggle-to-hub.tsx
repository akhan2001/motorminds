"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"

/**
 * Props to control whether to show/hide a "LIST VIEW" button to jump
 * to mechanic-hub?view=list if needed. You can remove if unneeded.
 */
interface ViewToggleToHubProps {
  showListView?: boolean
}

/**
 * A toggle that sends the user back to /mechanic-hub with the given
 * ?view=board or ?view=calendar (or list).
 *
 * On first load, no button is highlighted; it only highlights
 * after the user actually clicks it.
 */
export function ViewToggleToHub({ showListView = false }: ViewToggleToHubProps) {
  // Use `null` for no active highlight initially.
  const [activeView, setActiveView] = useState<"board" | "calendar" | "list" | null>(null)

  const handleViewChange = (view: "board" | "calendar" | "list") => {
    setActiveView(view)
  }

  return (
    <div className="flex items-center gap-4">
      <motion.div
        className="bg-[#222222] p-1 rounded-full inline-flex"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Board View */}
        <Link href="/mechanic-hub?view=board">
          <motion.button
            onClick={() => handleViewChange("board")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-colors",
              activeView === "board"
                ? "bg-[#2D2D2D] text-white"
                : "text-[#9d9d9d] hover:text-white",
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            BOARD VIEW
          </motion.button>
        </Link>

        {/* Calendar View */}
        <Link href="/mechanic-hub?view=calendar">
          <motion.button
            onClick={() => handleViewChange("calendar")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-colors",
              activeView === "calendar"
                ? "bg-[#2D2D2D] text-white"
                : "text-[#9d9d9d] hover:text-white",
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            CALENDAR VIEW
          </motion.button>
        </Link>

        {/* (Optional) List View */}
        {showListView && (
          <Link href="/mechanic-hub?view=list">
            <motion.button
              onClick={() => handleViewChange("list")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-colors",
                activeView === "list"
                  ? "bg-[#2D2D2D] text-white"
                  : "text-[#9d9d9d] hover:text-white",
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LIST VIEW
            </motion.button>
          </Link>
        )}
      </motion.div>

      {/* If you want a direct link to the hub without choosing a view:
      
      <Link href="/mechanic-hub">
        <motion.button
          className="bg-[#222222] hover:bg-[#333333] text-white rounded-full px-6 py-2.5 h-auto transition-colors duration-200 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          GO TO HUB
        </motion.button>
      </Link>
      */}
    </div>
  )
}
