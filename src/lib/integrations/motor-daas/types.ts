export interface MotorVehicle {
    motorVehicleId: number
    vcdbBaseVehicleId: number
    year: number
    make: string
    model: string
    vin: string
}

export interface MotorApiResponse<T> {
    data: T
    success: boolean
    message?: string
    error?: string
}