'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock } from 'lucide-react'
import { formatNumber } from '@/lib/utils/currency'
import { WorkOrderKanbanColumn, WorkOrderKanbanItem } from '../../../types/work-order'
import { DraggableWorkOrderCard } from './DraggableWorkOrderCard'
import { WorkOrderCardSmall } from '../work-order-card-small'
import { useDragDrop } from './DragDropContext'

interface DroppableColumnProps {
  column: WorkOrderKanbanColumn
  onCardClick?: (item: WorkOrderKanbanItem) => void
  isCompactView?: boolean
}


const KanbanColumn: React.FC<DroppableColumnProps> = ({ 
    column, 
    onCardClick, 
    isCompactView = false 
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
        
        // Only clear if leaving the column entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver(null)
        }
    }

    const handleColumnDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        
        try {
            const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
            const { item, sourceColumn } = dragData
            
            // Don't process if dropping in the same column
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
            {/* Column Header - Fixed height with strict padding */}
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0 bg-slate-50 dark:bg-[#111111]">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${column.color} flex-shrink-0`} />
                    <h3 className="font-semibold text-foreground dark:text-white text-sm">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-400 px-2 py-1">
                        {formatNumber(column.items.length)}
                    </Badge>
                </div>
            </div>
        
            {/* Column Content - Scrollable with strict grid layout */}
        <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-3">
                <AnimatePresence>
                    {column.items.length > 0 ? (
                        column.items.map((item, index) => (
                            <DraggableWorkOrderCard 
                                key={`${column.id}-${item.id}-${index}`}
                                item={item}
                                onClick={onCardClick}
                                isCompactView={isCompactView}
                                index={index}
                                columnId={column.id}
                            />
                        ))
                    ) : (
                        <motion.div 
                            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Clock className="h-8 w-8 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No work orders</p>
                            <p className="text-xs text-muted-foreground mt-1">Drag work orders here</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </ScrollArea>

        {/* Column drag overlay */}
        {isDragOver && (
            <motion.div
                className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg bg-blue-500/5 pointer-events-none z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="flex items-center justify-center h-full">
                    <div className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/50">
                        <span className="text-blue-400 text-sm font-medium">
                            Drop to move to {column.title}
                        </span>
                    </div>
                </div>
            </motion.div>
        )}
        </div>
    )
}

export const DroppableColumn: React.FC<DroppableColumnProps> = (props) => {
    return (
        <motion.div
            className="h-full bg-slate-50 dark:bg-[#111111] border-r border-border dark:border-[#2a2a2a] last:border-r-0 min-h-0 flex flex-col relative"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                minWidth: 0, // Prevent flex items from overflowing
                flex: '1 1 0', // Share space with other status columns (archive column has fixed width)
            }}
        >
            <KanbanColumn {...props} />
        </motion.div>
    )
}

export default DroppableColumn