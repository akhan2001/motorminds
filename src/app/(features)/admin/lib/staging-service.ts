import {
    StagingTable,
    StagingHealth,
    StagingVerification,
    StagingVerificationRequest,
    StagingVerificationResponse,
    StagingVerificationResult
} from '../types/migrations'

class StagingService {
    private baseUrl = '/api/admin/migrations/staging'

    async getStagingHealth(): Promise<StagingHealth> {
        try {
            const response = await fetch(`${this.baseUrl}?action=health`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching staging health:', error)
            throw error
        }
    }

    async getStagingTables(): Promise<StagingTable[]> {
        try {
            const response = await fetch(`${this.baseUrl}?action=tables`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching staging tables:', error)
            throw error
        }
    }

    async runStagingVerification(request: StagingVerificationRequest): Promise<StagingVerificationResponse> {
        try {
            const response = await fetch(`${this.baseUrl}?action=verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error running staging verification:', error)
            throw error
        }
    }

    async getVerificationHistory(): Promise<StagingVerification[]> {
        try {
            const response = await fetch(`${this.baseUrl}?action=history`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching verification history:', error)
            throw error
        }
    }

    async getVerificationDetails(verificationId: string): Promise<StagingVerificationResult> {
        try {
            const response = await fetch(`${this.baseUrl}/verification/${verificationId}`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return await response.json()
        } catch (error) {
            console.error('Error fetching verification details:', error)
            throw error
        }
    }

    async refreshStagingData(): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${this.baseUrl}?action=refresh`, {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error refreshing staging data:', error)
            throw error
        }
    }
}

export const stagingService = new StagingService()
