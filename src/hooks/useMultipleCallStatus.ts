import { useCallStatus } from './useCallStatus'

interface MultipleCallStatusOptions {
    enabled?: boolean
    pollInterval?: number
    timeout?: number
}

export function useMultipleCallStatus(callIds: string[], options: MultipleCallStatusOptions = {}) {
    const statuses = callIds.map(callId => ({
        callId,
        ...useCallStatus(callId, options)
    }))

    const activeCalls = statuses.filter(s => s.isLoading || s.isInProgress)
    const completedCalls = statuses.filter(s => s.isCompleted)
    const failedCalls = statuses.filter(s => s.isFailed)

    return {
        statuses,
        activeCalls,
        completedCalls,
        failedCalls,
        hasActiveCalls: activeCalls.length > 0,
        totalCalls: callIds.length,
        successRate: callIds.length > 0 ? completedCalls.length / callIds.length : 0
    }
}
