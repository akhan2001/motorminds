import { createClient } from '@/utils/supabase/server'

export interface ShopData {
  shop_name: string
  shop_email: string
  shop_phone: string
  shop_address: string
  shop_city: string
  shop_province: string
  website?: string | null
  business_number?: string | null
  hst_number?: string | null
  services_offered: string
  operating_hours: string
  shop_owner: string
}

export class ShopService {
  /**
   * Create a new shop record
   * This should be called while the user is still anonymous to avoid RLS issues
   */
  async createShop(shopData: ShopData) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('shops')
        .insert([{
          shop_name: shopData.shop_name,
          shop_email: shopData.shop_email,
          shop_phone: shopData.shop_phone,
          shop_address: shopData.shop_address,
          shop_city: shopData.shop_city,
          shop_province: shopData.shop_province,
          website: shopData.website || null,
          business_number: shopData.business_number || null,
          hst_number: shopData.hst_number || null,
          services_offered: shopData.services_offered,
          operating_hours: shopData.operating_hours,
          shop_owner: shopData.shop_owner,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Shop creation error:', error)
        throw new Error(`Failed to create shop profile: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.createShop error:', error)
      throw error
    }
  }

  /**
   * Get shop by ID
   */
  async getShopById(shopId: string) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Shop fetch error:', error)
        throw new Error(`Failed to fetch shop: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopById error:', error)
      throw error
    }
  }

  /**
   * Update shop information
   */
  async updateShop(shopId: string, updates: Partial<ShopData>) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('shops')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Shop update error:', error)
        throw new Error(`Failed to update shop: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.updateShop error:', error)
      throw error
    }
  }

  /**
   * Delete shop (soft delete by setting status)
   */
  async deleteShop(shopId: string) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('shops')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Shop delete error:', error)
        throw new Error(`Failed to delete shop: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.deleteShop error:', error)
      throw error
    }
  }
}

// Export a singleton instance
export const shopService = new ShopService()
