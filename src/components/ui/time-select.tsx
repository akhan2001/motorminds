'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimeSelectProps {
    value: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
}

export function TimeSelect({ value, onChange, className = '', placeholder = 'Select time' }: TimeSelectProps) {
    // Generate time options in 30-minute intervals (8:00 AM to 8:00 PM by default)
    const generateTimeOptions = () => {
        const times: string[] = []
        for (let hour = 8; hour <= 20; hour++) { // 8 AM to 8 PM
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                times.push(timeString)
            }
        }
        return times
    }

    const timeOptions = generateTimeOptions()

    // Format time for display (12-hour format)
    const formatTimeDisplay = (time: string) => {
        if (!time) return ''
        
        const [hours, minutes] = time.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    return (
        <Select value={value} onValueChange={onChange}>     
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder}>
                    {value ? formatTimeDisplay(value) : placeholder}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60 bg-white dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
                {timeOptions.map((time) => (
                    <SelectItem key={time} value={time} className="text-foreground hover:bg-accent dark:hover:bg-[#2a2a2a]/80 focus:bg-accent dark:focus:bg-[#2a2a2a]/80">
                        {formatTimeDisplay(time)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
