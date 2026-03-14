/**
 * React Query Keys for Vehicle Data
 *
 * Centralized key management for vehicle queries.
 */

export const vehicleKeys = {
    all: ['vehicles'] as const,

    lists: () => [...vehicleKeys.all, 'list'] as const,
    list: (filters?: {
        search?: string
        shopFilter?: string
        page?: number
    }) => [...vehicleKeys.lists(), filters] as const,

    details: () => [...vehicleKeys.all, 'detail'] as const,
    detail: (vehicleId: string) => [...vehicleKeys.details(), vehicleId] as const,

    histories: () => [...vehicleKeys.all, 'history'] as const,
    history: (vehicleId: string) =>
        [...vehicleKeys.histories(), vehicleId] as const,
}

export const vehicleInvalidations = {
    allLists: () => vehicleKeys.lists(),
    vehicle: (vehicleId: string) => [
        vehicleKeys.detail(vehicleId),
        vehicleKeys.history(vehicleId),
    ],
}
