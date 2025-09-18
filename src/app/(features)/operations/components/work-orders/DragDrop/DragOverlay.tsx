'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WorkOrderCard } from '../work-order-card'
import { useDragDrop } from './DragDropContext'

const DragOverlay: React.FC = () => {
    const { draggedItem, isDragging } = useDragDrop()
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
        }
    }, [isDragging])

  return (
    <AnimatePresence>
        {isDragging && draggedItem && (
            <motion.div
                className="fixed inset-0 pointer-events-none z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                >
                <motion.div
                    className="absolute"
                    initial={{ scale: 0.8, rotate: -5 }}
                    animate={{ scale: 1, rotate: 2 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{ 
                    left: mousePosition.x - 150, // Offset to center the card
                    top: mousePosition.y - 60,
                    width: '300px',
                    filter: "drop-shadow(0 20px 25px rgba(0,0,0,0.4))",
                    transform: 'translate3d(0, 0, 0)' // Hardware acceleration
                    }}
                >
                    <div className="opacity-90 scale-105">
                    <WorkOrderCard item={draggedItem} onClick={() => {}} />
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  )
}

export default DragOverlay