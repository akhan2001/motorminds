import { generateAuthSignature } from './auth'

const BASE_URL = 'https://api.motor.com/v1'
const PUBLIC_KEY = 'izlXzLYxY4'

export class MotorDaasClient {

    async getVehicleInfo(vin: string) {
        const uri = `${BASE_URL}/Information/YMME/VehicleInfo/${vin}`
        const signature = generateAuthSignature(uri, 'GET')
        const epoch = Math.floor(Date.now() / 1000)

        const url = `${uri}?Scheme=Shared&XDate=${epoch}&ApiKey=${PUBLIC_KEY}&Sig=${encodeURIComponent(signature)}`

        const response = await fetch(url)
        return response.json()
    }
}
