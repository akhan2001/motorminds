'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { WorkOrderCard } from '../work-order-card'
import { WorkOrderCardSmall } from '../work-order-card-small'
import { WorkOrderKanbanItem } from '../../../types/work-order'
import { useDragDrop } from './DragDropContext'

interface DraggableWorkOrderCardProps {
    item: WorkOrderKanbanItem
    onClick?: (item: WorkOrderKanbanItem) => void
    isCompactView?: boolean
    index: number
    columnId: string
}

const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { 
        opacity: 0, 
        y: -20, 
        scale: 0.95,
        transition: { duration: 0.2 }
    }
}

export const DraggableWorkOrderCard: React.FC<DraggableWorkOrderCardProps> = ({ 
    item, 
    onClick,
    isCompactView = false,
    index,
    columnId
}) => {
    const { startDrag, endDrag, isDragging, draggedItem, canDragItem } = useDragDrop()
    const [isBeingDragged, setIsBeingDragged] = useState(false)
    const isDragDisabled = !canDragItem(item)

    const handleDragStart = (e: React.DragEvent) => {
        setIsBeingDragged(true)
        startDrag(item)
        
        // Set drag data
        e.dataTransfer.setData('text/plain', JSON.stringify({
        item,
        sourceColumn: columnId,
        sourceIndex: index
        }))
        
        // Set drag effect
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragEnd = () => {
        setIsBeingDragged(false)
        endDrag()
    }

    const handleClick = () => {
        if (!isDragging && !isBeingDragged) {
        onClick?.(item)
        }
    }

    // Determine if this card is being dragged
    const isDraggedCard = draggedItem?.id === item.id

    return (
        <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
            className="w-full"
        >
            <div
                draggable={!isDragDisabled}
                onDragStart={!isDragDisabled ? handleDragStart : undefined}
                onDragEnd={!isDragDisabled ? handleDragEnd : undefined}
                onClick={handleClick}
                className={`
                ${!isDragDisabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} 
                select-none w-full
                ${isDraggedCard ? 'opacity-30' : 'opacity-100'}
                ${isBeingDragged ? 'scale-105 rotate-1' : 'scale-100'}
                ${isDragDisabled ? 'opacity-60' : ''}
                transition-all duration-200
                `}
                style={{
                transformOrigin: 'center'
                }}
            >
                {isCompactView ? (
                    <WorkOrderCardSmall item={item} onClick={handleClick} />
                ) : (
                    <WorkOrderCard item={item} onClick={handleClick} />
                )}
            </div>
        </motion.div>
    )
}

export default DraggableWorkOrderCard