import { useQuery } from '@tanstack/react-query'

interface EngineResponse {
    EngineID: number
    Description: string
    Designation?: string
    CylinderLiter?: string
    Cylinders?: number
    FuelType?: string
    Aspiration?: string
    HorsePower?: number
    KilowattPower?: number
    Valves?: number
    BlockType?: string
    CylinderHeadType?: string
    IgnitionSystem?: string
    Manufacturer?: string
    Version?: string
    CID?: string
    CylinderCC?: string
}

interface UseMotorEnginesParams {
    baseVehicleId?: number
    enabled?: boolean
}

export function useMotorEngines({ baseVehicleId, enabled = true }: UseMotorEnginesParams) {
    return useQuery<EngineResponse[]>({
        queryKey: ['motor-engines', baseVehicleId],
        queryFn: async () => {
            if (!baseVehicleId) {
                return []
            }

            // Call our internal API route that proxies to MOTOR DaaS
            const response = await fetch(`/api/motor-daas/engines?baseVehicleId=${baseVehicleId}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch engines: ${response.statusText}`)
            }

            const data = await response.json()
            return data.engines || []
        },
        enabled: enabled && !!baseVehicleId,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    })
}
