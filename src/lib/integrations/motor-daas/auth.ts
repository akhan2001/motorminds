import crypto from 'crypto'

const PUBLIC_KEY = 'izlXzLYxY4'
const PRIVATE_KEY = 'AhmBYEXENuEdrr9s-yG-UeqG9'
const BASE_URL = 'https://api.motor.com/v1'

export function generateAuthSignature(uri: string, verb: string): string {
    const epoch = Math.floor(Date.now() / 1000)
    const relativePath = uri.replace(BASE_URL, '')
    const rawSignature = `${PUBLIC_KEY}\n${verb}\n${epoch}\n${relativePath}`

    const hmac = crypto.createHmac('sha256', PRIVATE_KEY)
    hmac.update(rawSignature)
    return hmac.digest('base64')
}