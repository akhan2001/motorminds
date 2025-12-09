import { supabase } from "@/lib/supabase"

// Request deduplication: Prevent multiple simultaneous getUser() calls
let cachedUserPromise: Promise<any> | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 1000 // 1 second cache to prevent thundering herd

export async function checkUser() {
    const now = Date.now()

    // Return cached promise if request is already in flight
    if (cachedUserPromise && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedUserPromise.then(result => result.user)
    }

    // Create new request and cache the promise
    cacheTimestamp = now
    cachedUserPromise = supabase.auth.getUser().then(({ data }) => {
        return data
    })

    const data = await cachedUserPromise
    return data.user
}