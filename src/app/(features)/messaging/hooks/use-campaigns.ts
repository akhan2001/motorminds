import { useState } from 'react'
import { toast } from 'sonner'
import type { 
    MassCampaign, 
    MassCampaignCreateData, 
    MassCampaignUpdateData,
    CampaignStats 
} from '../types/mass-campaign'

export function useCampaigns() {
    const [isLoading, setIsLoading] = useState(false)
    const [campaigns, setCampaigns] = useState<MassCampaign[]>([])
    const [stats, setStats] = useState<CampaignStats | null>(null)

    // Fetch all campaigns
    const fetchCampaigns = async (includeStats = false) => {
        setIsLoading(true)
        try {
            const url = includeStats 
                ? '/api/messaging/campaigns?include_stats=true'
                : '/api/messaging/campaigns'
            
            const response = await fetch(url)
            if (!response.ok) throw new Error('Failed to fetch campaigns')
            
            const data = await response.json()
            
            if (includeStats) {
                setCampaigns(data.campaigns)
                setStats(data.stats)
            } else {
                setCampaigns(data)
            }
            
            return data
        } catch (error: any) {
            console.error('Error fetching campaigns:', error)
            toast.error('Failed to load campaigns')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Fetch single campaign
    const fetchCampaign = async (campaignId: string): Promise<MassCampaign | null> => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/messaging/campaigns/${campaignId}`)
            if (!response.ok) {
                if (response.status === 404) return null
                throw new Error('Failed to fetch campaign')
            }
            
            const data = await response.json()
            return data
        } catch (error: any) {
            console.error('Error fetching campaign:', error)
            toast.error('Failed to load campaign')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Create campaign
    const createCampaign = async (data: Omit<MassCampaignCreateData, 'shop_id'>): Promise<MassCampaign> => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/messaging/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create campaign')
            }

            const result = await response.json()
            toast.success('Campaign created successfully')
            
            // Refresh campaigns list
            await fetchCampaigns()
            
            return result.campaign
        } catch (error: any) {
            console.error('Error creating campaign:', error)
            toast.error(error.message || 'Failed to create campaign')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Update campaign
    const updateCampaign = async (
        campaignId: string, 
        data: MassCampaignUpdateData
    ): Promise<MassCampaign> => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/messaging/campaigns/${campaignId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to update campaign')
            }

            const result = await response.json()
            toast.success('Campaign updated successfully')
            
            // Refresh campaigns list
            await fetchCampaigns()
            
            return result.campaign
        } catch (error: any) {
            console.error('Error updating campaign:', error)
            toast.error(error.message || 'Failed to update campaign')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Delete campaign
    const deleteCampaign = async (campaignId: string): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/messaging/campaigns/${campaignId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete campaign')
            }

            toast.success('Campaign deleted successfully')
            
            // Refresh campaigns list
            await fetchCampaigns()
        } catch (error: any) {
            console.error('Error deleting campaign:', error)
            toast.error(error.message || 'Failed to delete campaign')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    // Schedule campaign
    const scheduleCampaign = async (
        campaignId: string, 
        scheduledSendAt: string | null
    ): Promise<MassCampaign> => {
        return updateCampaign(campaignId, {
            scheduled_send_at: scheduledSendAt,
            status: scheduledSendAt ? 'scheduled' : 'draft'
        })
    }

    // Send campaign immediately
    const sendCampaign = async (campaignId: string): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/messaging/campaigns/${campaignId}/send`, {
                method: 'POST'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send campaign')
            }

            toast.success('Campaign sent successfully')
            
            // Refresh campaigns list
            await fetchCampaigns()
        } catch (error: any) {
            console.error('Error sending campaign:', error)
            toast.error(error.message || 'Failed to send campaign')
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    return {
        campaigns,
        stats,
        isLoading,
        fetchCampaigns,
        fetchCampaign,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        scheduleCampaign,
        sendCampaign
    }
}

