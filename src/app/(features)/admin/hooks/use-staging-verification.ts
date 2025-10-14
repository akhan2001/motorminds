import { useState, useEffect, useCallback } from 'react'
import { stagingService } from '../lib/staging-service'
import {
    StagingHealth,
    StagingTable,
    StagingVerification,
    StagingVerificationRequest,
    StagingVerificationResponse
} from '../types/migrations'

export function useStagingHealth() {
    const [health, setHealth] = useState<StagingHealth | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchHealth = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await stagingService.getStagingHealth()
            setHealth(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch staging health')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchHealth()
    }, [fetchHealth])

    return {
        health,
        loading,
        error,
        refetch: fetchHealth
    }
}

export function useStagingTables() {
    const [tables, setTables] = useState<StagingTable[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTables = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await stagingService.getStagingTables()
            setTables(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch staging tables')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTables()
    }, [fetchTables])

    return {
        tables,
        loading,
        error,
        refetch: fetchTables
    }
}

export function useStagingVerification() {
    const [verifications, setVerifications] = useState<StagingVerification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [running, setRunning] = useState(false)

    const fetchVerifications = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await stagingService.getVerificationHistory()
            setVerifications(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch verification history')
        } finally {
            setLoading(false)
        }
    }, [])

    const runVerification = useCallback(async (request: StagingVerificationRequest): Promise<StagingVerificationResponse> => {
        try {
            setRunning(true)
            setError(null)
            const response = await stagingService.runStagingVerification(request)

            // Refresh the verification history after running
            await fetchVerifications()

            return response
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to run verification'
            setError(errorMessage)
            throw err
        } finally {
            setRunning(false)
        }
    }, [fetchVerifications])

    const refreshStagingData = useCallback(async () => {
        try {
            setRunning(true)
            setError(null)
            const response = await stagingService.refreshStagingData()

            // Refresh tables and health after refresh
            await fetchVerifications()

            return response
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to refresh staging data'
            setError(errorMessage)
            throw err
        } finally {
            setRunning(false)
        }
    }, [fetchVerifications])

    useEffect(() => {
        fetchVerifications()
    }, [fetchVerifications])

    return {
        verifications,
        loading,
        error,
        running,
        refetch: fetchVerifications,
        runVerification,
        refreshStagingData
    }
}
