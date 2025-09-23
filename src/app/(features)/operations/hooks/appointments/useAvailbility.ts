import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AvailabilityService } from '../../lib/availability-service'
import type { 
    AvailableSlot, 
    DayAvailability, 
    WeekAvailability,
    AvailabilityQuery,
    AvailabilityCheck 
} from '../../types/availability'

// Query keys
export const availabilityKeys = {
    all: ['availability'] as const,
    slots: () => [...availabilityKeys.all, 'slots'] as const,
    slot: (shopId: string, date: string) => 
        [...availabilityKeys.slots(), shopId, date] as const,
    checks: () => [...availabilityKeys.all, 'checks'] as const,
    check: (query: AvailabilityQuery) => 
        [...availabilityKeys.checks(), query] as const,
    days: () => [...availabilityKeys.all, 'days'] as const,
    day: (shopId: string, date: string) => 
        [...availabilityKeys.days(), shopId, date] as const,
    weeks: () => [...availabilityKeys.all, 'weeks'] as const,
    week: (shopId: string, weekStart: string) => 
        [...availabilityKeys.weeks(), shopId, weekStart] as const,
}

/**
 * Hook to fetch available time slots for a specific date
 */
export const useAvailableSlots = (
    shopId: string,
    date: string
) => {
    return useQuery({
        queryKey: availabilityKeys.slot(shopId, date),
        queryFn: () => AvailabilityService.getAvailableSlots(shopId, date),
        enabled: !!shopId && !!date && !AvailabilityService.isDateInPast(date),
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    })
}

/**
 * Hook to check if a specific time slot is available
 */
export const useSlotAvailabilityCheck = (shopId: string, date: string, time: string) => {
    return useQuery({
        queryKey: ['slotCheck', shopId, date, time],
        queryFn: () => AvailabilityService.checkSlotAvailability(shopId, date, time),
        enabled: !!shopId && !!date && !!time,
        staleTime: 30 * 1000, // 30 seconds
    })
}

/**
 * Hook to fetch availability for a single day
 */
export const useDayAvailability = (shopId: string, date: string) => {
    return useQuery({
        queryKey: availabilityKeys.day(shopId, date),
        queryFn: () => AvailabilityService.getDayAvailability(shopId, date),
        enabled: !!shopId && !!date,
        staleTime: 2 * 60 * 1000, // 2 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    })
}

/**
 * Hook to fetch availability for an entire week
 */
export const useWeekAvailability = (shopId: string, weekStart: string) => {
    return useQuery({
        queryKey: availabilityKeys.week(shopId, weekStart),
        queryFn: () => AvailabilityService.getWeekAvailability(shopId, weekStart),
        enabled: !!shopId && !!weekStart,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    })
}

/**
 * Hook to get available slots for the next 7 days
 */
export const useUpcomingAvailability = (shopId: string) => {
    const today = new Date()
    const dates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        return date.toISOString().split('T')[0]
    })

    // Create multiple queries for each date
    const results = dates.map(date => 
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAvailableSlots(shopId, date)
    )

    // Combine results
    const isLoading = results.some(result => result.isLoading)
    const error = results.find(result => result.error)?.error
    
    const data = isLoading || error ? undefined : dates.map((date, index) => ({
        date,
        slots: results[index].data || []
    }))

    return {
        data,
        isLoading,
        error,
        refetch: () => results.forEach(result => result.refetch())
    }
}

/**
 * Hook to validate appointment booking constraints
 */
export const useBookingValidation = () => {
    return {
        validateDate: (date: string): { isValid: boolean; error?: string } => {
            // Check if date is in the past
            if (AvailabilityService.isDateInPast(date)) {
                return {
                    isValid: false,
                    error: 'Cannot book appointments in the past'
                }
            }

            // Check if date is too far in the future
            if (AvailabilityService.isDateTooFar(date)) {
                return {
                    isValid: false,
                    error: 'Cannot book appointments more than 90 days in advance'
                }
            }

            return { isValid: true }
        },

        validateTime: (date: string, time: string): { isValid: boolean; error?: string } => {
            // Check if time is too soon
            if (AvailabilityService.isTimeTooSoon(date, time)) {
                return {
                    isValid: false,
                    error: 'Appointments must be booked at least 2 hours in advance'
                }
            }

            return { isValid: true }
        },

        validateSlot: (
            date: string, 
            time: string, 
            duration: number = 60
        ): { isValid: boolean; error?: string } => {
            // Check if date is in the past
            if (AvailabilityService.isDateInPast(date)) {
                return {
                    isValid: false,
                    error: 'Cannot book appointments in the past'
                }
            }

            // Check if date is too far in the future
            if (AvailabilityService.isDateTooFar(date)) {
                return {
                    isValid: false,
                    error: 'Cannot book appointments more than 90 days in advance'
                }
            }

            // Check if time is too soon
            if (AvailabilityService.isTimeTooSoon(date, time)) {
                return {
                    isValid: false,
                    error: 'This time has already passed'
                }
            }

            return { isValid: true }
        }
    }
}

/**
 * Hook to find the next available slot
 */
export const useNextAvailableSlot = (
    shopId: string,
    preferredDate?: string
) => {
    const startDate = preferredDate || new Date().toISOString().split('T')[0]
    
    return useQuery({
        queryKey: ['nextAvailableSlot', shopId, startDate],
        queryFn: async (): Promise<AvailableSlot | null> => {
            // Check the next 14 days for availability
            for (let i = 0; i < 14; i++) {
                const date = new Date(startDate)
                date.setDate(date.getDate() + i)
                const dateStr = date.toISOString().split('T')[0]

                try {
                    const slots = await AvailabilityService.getAvailableSlots(
                        shopId, 
                        dateStr
                    )
                    
                    const availableSlot = slots.find(slot => slot.isAvailable)
                    if (availableSlot) {
                        return {
                            ...availableSlot,
                            // Add the date for context
                            date: dateStr
                        } as AvailableSlot & { date: string }
                    }
                } catch (error) {
                    console.warn(`Failed to check availability for ${dateStr}:`, error)
                    continue
                }
            }

            return null // No available slots found in the next 14 days
        },
        enabled: !!shopId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook to get recommended time slots based on shop patterns
 */
export const useRecommendedSlots = (
    shopId: string,
    date: string
) => {
    return useQuery({
        queryKey: ['recommendedSlots', shopId, date],
        queryFn: async (): Promise<AvailableSlot[]> => {
            const allSlots = await AvailabilityService.getAvailableSlots(
                shopId, 
                date
            )

            // Filter only available slots
            const availableSlots = allSlots.filter(slot => slot.isAvailable)

            // Apply general recommendations
            const recommendations = availableSlots.map(slot => {
                const hour = parseInt(slot.time.split(':')[0])
                let priority = 1

                // Morning slots (8-11 AM) are generally preferred
                if (hour >= 8 && hour <= 11) {
                    priority += 0.3
                }

                // Early afternoon slots (1-3 PM) are good
                if (hour >= 13 && hour <= 15) {
                    priority += 0.2
                }

                // Avoid lunch time (12-1 PM) for customer convenience
                if (hour === 12) {
                    priority -= 0.2
                }

                return {
                    ...slot,
                    priority
                }
            })

            // Sort by priority (descending) and return top recommendations
            return recommendations
                .sort((a, b) => (b as any).priority - (a as any).priority)
                .slice(0, 6) // Return top 6 recommendations
        },
        enabled: !!shopId && !!date && !AvailabilityService.isDateInPast(date),
        staleTime: 2 * 60 * 1000, // 2 minutes
    })
}
