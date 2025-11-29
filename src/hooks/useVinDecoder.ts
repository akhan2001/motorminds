'use client'

import { useMutation } from '@tanstack/react-query'
import { useRef, useCallback } from 'react'
import { decodeVin as decodeVinUtil } from '@/app/(features)/customers/vehicles/lib/vin-decode'
import { toast } from 'sonner'

interface VinData {
    year: string
    make: string
    model: string
    engine: string
}

export function useVinDecoder() {
    const timer = useRef<NodeJS.Timeout | null>(null)

    const mutation = useMutation<VinData, Error, string>(async (vin: string) => {
        const data = await decodeVinUtil(vin)
        return data as VinData
    }, {
        onError(err) {
            toast.error(err.message || 'VIN decode failed')
        },
    })

    const decodeVin = useCallback((vin: string) => {
        if (!vin) return
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
            mutation.mutate(vin)
        }, 300)
    }, [mutation])

    return {
        decodeVin,
        data: mutation.data,
        isLoading: mutation.isLoading,
        error: mutation.error,
    }
} 