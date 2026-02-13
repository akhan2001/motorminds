import { useQuery } from '@tanstack/react-query'

export interface DeploymentCommitData {
    commitSha: string
    commitTime: string
}

async function getDeploymentCommit(): Promise<DeploymentCommitData> {
    const response = await fetch('/api/deployment-commit', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch deployment commit')
    }

    return response.json()
}

/**
 * React Query hook to fetch deployment commit information
 * Caches for 10 minutes to avoid excessive requests
 * In development with TEST_MODE, reduces intervals for faster testing
 */
export function useDeploymentCommitQuery(enabled: boolean = true) {
    const isTestMode = process.env.NEXT_PUBLIC_TEST_DEPLOYMENT_CHECK === 'true'
    
    return useQuery<DeploymentCommitData, Error>({
        queryKey: ['deployment-commit'],
        queryFn: getDeploymentCommit,
        enabled,
        staleTime: isTestMode ? 1000 * 10 : 1000 * 60 * 10, // 10 seconds in test mode, 10 minutes otherwise
        refetchInterval: isTestMode ? 1000 * 30 : 1000 * 60 * 15, // 30 seconds in test mode, 15 minutes otherwise
        retry: 2,
    })
}

