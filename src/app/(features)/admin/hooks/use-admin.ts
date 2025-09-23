// src/app/(features)/admin/hooks/use-admin.ts

import { useState, useEffect, useCallback } from 'react'
import { AdminService } from '../lib/admin-service'
import type { Shop, AdminStats } from '../types/admin'

interface UseAdminReturn {
    shops: Shop[]
    stats: AdminStats | null
    loading: boolean
    error: string | null
    refreshShops: () => Promise<void>
    refreshStats: () => Promise<void>
    updateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => Promise<void>
    updateUserPlan: (userId: string, plan: 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE') => Promise<void>
}

export function useAdmin(): UseAdminReturn {
    const [shops, setShops] = useState<Shop[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const adminService = new AdminService()

    const refreshShops = useCallback(async () => {
        try {
            setError(null)
            const shopsData = await adminService.getAllShops()
            setShops(shopsData)
        } catch (err) {
            console.error('Error fetching shops:', err)
            setError('Failed to fetch shops')
        }
    }, [])

    const refreshStats = useCallback(async () => {
        try {
            setError(null)
            const statsData = await adminService.getAdminStats()
            setStats(statsData)
        } catch (err) {
            console.error('Error fetching stats:', err)
            setError('Failed to fetch statistics')
        }
    }, [])

    const updateUserStatus = useCallback(async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
        try {
            setError(null)
            await adminService.updateUserStatus(userId, status)
            
            // Refresh data to get updated information
            await Promise.all([
                refreshShops(),
                refreshStats()
            ])
        } catch (err) {
            console.error('Error updating user status:', err)
            setError('Failed to update user status')
        }
    }, [refreshShops, refreshStats])

    const updateUserPlan = useCallback(async (userId: string, plan: 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE') => {
        try {
            setError(null)
            await adminService.updateUserPlan(userId, plan)
            
            // Refresh data to get updated information
            await Promise.all([
                refreshShops(),
                refreshStats()
            ])
        } catch (err) {
            console.error('Error updating user plan:', err)
            setError('Failed to update user plan')
        }
    }, [refreshShops, refreshStats])

    // Initial data fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true)
            try {
                await Promise.all([
                    refreshShops(),
                    refreshStats()
                ])
            } catch (err) {
                console.error('Error fetching initial data:', err)
                setError('Failed to load admin data')
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()
    }, [refreshShops, refreshStats])

    return {
        shops,
        stats,
        loading,
        error,
        refreshShops,
        refreshStats,
        updateUserStatus,
        updateUserPlan
    }
}