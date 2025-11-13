// src/app/(features)/admin/lib/admin-service.ts

import { createClient } from '@/lib/supabase'
import type { Shop, AdminStats, UsersByShop, User, ShopWithUsers, AdminType } from '../types/admin'
import { findPrimaryUser, groupUsersByShop, countUsersByStatus, countUsersByPlan } from '@/lib/utils/users'

export class AdminService {
    private supabase = createClient()

    // Context-aware shop fetching
    async getShops(context?: { adminType: AdminType; organizationId?: string; shopId?: string }): Promise<Shop[]> {
        try {
            const url = context 
                ? `/api/admin/shops${context.adminType === 'super-admin' ? '?super_admin=true' : ''}`
                : '/api/admin/shops'
            
            const response = await fetch(url)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch shops')
            }
            
            return data.shops || []
        } catch (error) {
            console.error('Error fetching shops:', error)
            throw error
        }
    }

    // Context-aware user fetching
    async getUsers(context?: { adminType: AdminType; organizationId?: string; shopId?: string }): Promise<User[]> {
        try {
            const response = await fetch('/api/admin/users')
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch users')
            }
            
            return data.users || []
        } catch (error) {
            console.error('Error fetching users:', error)
            throw error
        }
    }

    // Get shop by ID (context-aware)
    async getShopById(id: string): Promise<Shop> {
        try {
            const response = await fetch(`/api/admin/shop/${id}`)
            const data = await response.json()
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch shop')
            }
            
            return data.shop
        } catch (error) {
            console.error('Error fetching shop:', error)
            throw error
        }
    }

    async getAllShops(): Promise<Shop[]> {
        try {
            // Get all shops from the shops table with complete schema
            const { data: shops, error: shopsError } = await this.supabase
                .from('shops')
                .select(`
                    id,
                    shop_name,
                    shop_email,
                    shop_phone,
                    shop_address,
                    website,
                    operating_hours,
                    services_offered,
                    created_at,
                    shop_city,
                    shop_owner,
                    shop_province,
                    banner_image_url,
                    logo_image_url,
                    facebook_url,
                    twitter_url,
                    instagram_url,
                    youtube_url,
                    shop_about,
                    shop_tagline,
                    hst_number,
                    business_number,
                    authorized_domains,
                    widget_config
                `)
                .order('created_at', { ascending: false })

            if (shopsError) {
                console.error('Error fetching shops:', shopsError)
                throw shopsError
            }

            // Get all users with their shop associations
            const { data: users, error: usersError } = await this.supabase
                .from('users')
                .select(`
                    id,
                    created_at,
                    role,
                    shop_id,
                    plan,
                    status
                `)
                .not('shop_id', 'is', null)

            if (usersError) {
                console.error('Error fetching users:', usersError)
                // Don't throw here, just continue without user data
            }

            // Group users by shop_id using utility function
            const usersByShop = groupUsersByShop(users || [])

            // Get revenue data (placeholder for future implementation)
            const revenueMap: Record<string, number> = {}

            // Combine shops with user data
            return (shops || []).map(shop => {
                const shopUsers = usersByShop[shop.id] || []
                
                // Find primary user using utility function
                const primaryUser = findPrimaryUser(shopUsers)

                return {
                    ...shop,
                    total_users: shopUsers.length,
                    total_revenue: revenueMap[shop.id] || 0,
                    primary_user_plan: primaryUser?.plan,
                    primary_user_status: primaryUser?.status
                }
            })

        } catch (error) {
            console.error('Error in getAllShops:', error)
            throw error
        }
    }

    async getAdminStats(): Promise<AdminStats> {
        try {
            // Get total shops count
            const { count: totalShops, error: shopsError } = await this.supabase
                .from('shops')
                .select('*', { count: 'exact', head: true })

            if (shopsError) {
                console.error('Error fetching shop count:', shopsError)
            }

            // Get all users with status and plan info
            const { data: users, error: usersError } = await this.supabase
                .from('users')
                .select('status, plan')

            if (usersError) {
                console.error('Error fetching users:', usersError)
                throw usersError
            }

            // Calculate user statistics using utility functions
            const statusCounts = countUsersByStatus(users || [])
            const planCounts = countUsersByPlan(users || [])

            return {
                totalShops: totalShops || 0,
                totalUsers: users?.length || 0,
                activeUsers: statusCounts['active'] || 0,
                inactiveUsers: statusCounts['inactive'] || 0,
                suspendedUsers: statusCounts['suspended'] || 0,
                planDistribution: {
                    DEFAULT: planCounts['DEFAULT'] || 0,
                    PREMIUM: planCounts['PREMIUM'] || 0,
                    ENTERPRISE: planCounts['ENTERPRISE'] || 0
                }
            }

        } catch (error) {
            console.error('Error in getAdminStats:', error)
            throw error
        }
    }

    async getShopsWithUsers(): Promise<ShopWithUsers[]> {
        try {
            // Get shops with their associated users
            const { data: shopsWithUsers, error } = await this.supabase
                .from('shops')
                .select(`
                    *,
                    users (
                        id,
                        created_at,
                        role,
                        shop_id,
                        plan,
                        status
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching shops with users:', error)
                throw error
            }

            return shopsWithUsers || []

        } catch (error) {
            console.error('Error in getShopsWithUsers:', error)
            throw error
        }
    }

    async getUsersByShop(): Promise<UsersByShop[]> {
        try {
            const { data: users, error } = await this.supabase
                .from('users')
                .select('shop_id')
                .not('shop_id', 'is', null)

            if (error) {
                console.error('Error fetching users by shop:', error)
                throw error
            }

            // Group users by shop_id
            const usersByShop = (users || []).reduce((acc, user) => {
                const existing = acc.find(item => item.shop_id === user.shop_id)
                if (existing) {
                    existing.user_count++
                } else {
                    acc.push({ shop_id: user.shop_id, user_count: 1 })
                }
                return acc
            }, [] as UsersByShop[])

            return usersByShop

        } catch (error) {
            console.error('Error in getUsersByShop:', error)
            throw error
        }
    }

    async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('users')
                .update({ status })
                .eq('id', userId)

            if (error) {
                console.error('Error updating user status:', error)
                throw error
            }

        } catch (error) {
            console.error('Error in updateUserStatus:', error)
            throw error
        }
    }

    async updateUserPlan(userId: string, plan: 'DEFAULT' | 'PREMIUM' | 'ENTERPRISE'): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('users')
                .update({ plan })
                .eq('id', userId)

            if (error) {
                console.error('Error updating user plan:', error)
                throw error
            }

        } catch (error) {
            console.error('Error in updateUserPlan:', error)
            throw error
        }
    }
}