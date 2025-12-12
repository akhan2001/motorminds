export const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'

export const API_URL = (() => {
    if (process.env.NODE_ENV === 'test') return 'http://localhost:3000/api'
    //  If running in platform, use API_URL from the env var
    if (IS_PLATFORM) return process.env.NEXT_PUBLIC_API_URL!
    // If running in browser, let it add the host
    if (typeof window !== 'undefined') return '/api'
    // If running self-hosted Vercel preview, use VERCEL_URL
    if (!!process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api`
    // If running on self-hosted, use NEXT_PUBLIC_SITE_URL
    if (!!process.env.NEXT_PUBLIC_SITE_URL) return `${process.env.NEXT_PUBLIC_SITE_URL}/api`
    return '/api'
})()

export const MOTOR_DAAS_URL = IS_PLATFORM
    ? process.env.MOTOR_DAAS_URL
    : process.env.MOTORMINDS_MOTOR_DAAS_URL
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// should be used for all dayjs formattings shown to the user. Includes timezone info.
export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'
export const DATETIME_FORMAT = 'DD MMM YYYY, HH:mm:ss (ZZ)'


export const DEVELOPER_HUB = process.env.NEXT_PUBLIC_DEVELOPER_HUB || 'https://www.motor.com/developer-hub/'