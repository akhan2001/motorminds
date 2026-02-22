'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Archive } from 'lucide-react'
import { WorkOrderKanbanColumn, WorkOrderKanbanItem } from '../../../types/work-order'
import { useDragDrop } from './DragDropContext'

interface ArchivedColumnProps {
    column: WorkOrderKanbanColumn
    onCardClick?: (item: WorkOrderKanbanItem) => void
    isCompactView?: boolean
}

export const ArchivedColumn: React.FC<ArchivedColumnProps> = ({
    column,
}) => {
    const { setDragOver, handleDrop, isDragging, dragOverColumn } = useDragDrop()

    const isDragOver = dragOverColumn === column.id

    const handleColumnDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'

        if (!isDragging) return

        setDragOver(column.id, 0)
    }

    const handleColumnDragLeave = (e: React.DragEvent) => {
        e.preventDefault()

        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(null)
        }
    }

    const handleColumnDrop = async (e: React.DragEvent) => {
        e.preventDefault()

        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
            const { item, sourceColumn } = dragData

            if (sourceColumn === column.id) {
                setDragOver(null)
                return
            }

            await handleDrop(item, column.id, 0)
            setDragOver(null)
        } catch (error) {
            console.error('Drop failed:', error)
        }
    }

    return (
        <motion.div
            className="h-full bg-slate-50 dark:bg-[#111111] border-r border-border dark:border-[#2a2a2a] last:border-r-0 min-h-0 flex flex-col relative flex-shrink-0"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                width: 64,
                minWidth: 64,
                maxWidth: 64,
            }}
        >
            <div
                className={`
                    h-full flex flex-col min-h-0 relative
                    ${isDragOver ? 'bg-blue-500/5' : 'bg-transparent'}
                    transition-colors duration-200
                `}
                onDragOver={handleColumnDragOver}
                onDragLeave={handleColumnDragLeave}
                onDrop={handleColumnDrop}
            >
                {/* Empty drop zone - icon only */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-2">
                    <Archive
                        className={`h-8 w-8 transition-colors ${
                            isDragOver ? 'text-blue-500 dark:text-blue-400' : 'text-muted-foreground dark:text-gray-400'
                        }`}
                    />
                </div>

                {/* Drag overlay */}
                {isDragOver && (
                    <motion.div
                        className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg bg-blue-500/5 pointer-events-none z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                )}
            </div>
        </motion.div>
    )
}

export default ArchivedColumn
