import { createClient } from '@/utils/supabase/client'

export interface ShopData {
  id?: string
  shop_name: string
  shop_email: string
  shop_phone: string
  shop_address: string
  shop_city?: string
  shop_province?: string
  website?: string
  operating_hours?: any // JSONB
  services_offered?: any // JSONB
  created_at?: string
  shop_owner?: string
  banner_image_url?: string
  logo_image_url?: string
  facebook_url?: string
  twitter_url?: string
  instagram_url?: string
  youtube_url?: string
  shop_about?: string
  shop_tagline?: string
  hst_number?: string
  business_number?: string
  financials_password_hash?: string
  financials_reset_token?: string
  financials_reset_token_expires_at?: string
  authorized_domains?: string[]
  widget_config?: any // JSONB
}

export interface ShopBusinessDetails {
  hst_number: string
  business_number: string
  shop_tagline: string
}

export class ShopService {
  private supabase = createClient()

  /**
   * Get complete shop information by ID
   */
  async getShopById(shopId: string): Promise<ShopData | null> {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching shop:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopById error:', error)
      return null
    }
  }

  /**
   * Get shop business details (HST, Business Number, Tagline)
   */
  async getShopBusinessDetails(shopId: string): Promise<ShopBusinessDetails> {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('hst_number, business_number, shop_tagline')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching business details:', error)
        return { hst_number: '', business_number: '', shop_tagline: '' }
      }

      return {
        hst_number: data?.hst_number || '',
        business_number: data?.business_number || '',
        shop_tagline: data?.shop_tagline || ''
      }
    } catch (error) {
      console.error('Error in getShopBusinessDetails:', error)
      return { hst_number: '', business_number: '', shop_tagline: '' }
    }
  }

  /**
   * Get shop contact information
   */
  async getShopContactInfo(shopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('shop_name, shop_email, shop_phone, shop_address, shop_city, shop_province, website')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching contact info:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopContactInfo error:', error)
      return null
    }
  }

  /**
   * Get shop branding information
   */
  async getShopBranding(shopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('shop_name, shop_tagline, logo_image_url, banner_image_url, shop_about')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching branding info:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopBranding error:', error)
      return null
    }
  }

  /**
   * Get shop social media links
   */
  async getShopSocialMedia(shopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('facebook_url, twitter_url, instagram_url, youtube_url')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching social media:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopSocialMedia error:', error)
      return null
    }
  }

  /**
   * Get shop operating hours and services
   */
  async getShopOperations(shopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('operating_hours, services_offered')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching operations info:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopOperations error:', error)
      return null
    }
  }

  /**
   * Get shop widget configuration
   */
  async getShopWidgetConfig(shopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('widget_config, authorized_domains')
        .eq('id', shopId)
        .single()

      if (error) {
        console.error('Error fetching widget config:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('ShopService.getShopWidgetConfig error:', error)
      return null
    }
  }

  /**
   * Update shop information
   */
  async updateShop(shopId: string, updates: Partial<ShopData>) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .update(updates)
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Error updating shop:', error)
        throw new Error(`Failed to update shop: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.updateShop error:', error)
      throw error
    }
  }

  /**
   * Update shop business details
   */
  async updateShopBusinessDetails(shopId: string, businessDetails: Partial<ShopBusinessDetails>) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .update(businessDetails)
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Error updating business details:', error)
        throw new Error(`Failed to update business details: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.updateShopBusinessDetails error:', error)
      throw error
    }
  }

  /**
   * Update shop branding
   */
  async updateShopBranding(shopId: string, branding: {
    shop_name?: string
    shop_tagline?: string
    logo_image_url?: string
    banner_image_url?: string
    shop_about?: string
  }) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .update(branding)
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Error updating branding:', error)
        throw new Error(`Failed to update branding: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.updateShopBranding error:', error)
      throw error
    }
  }

  /**
   * Update shop contact information
   */
  async updateShopContactInfo(shopId: string, contactInfo: {
    shop_email?: string
    shop_phone?: string
    shop_address?: string
    shop_city?: string
    shop_province?: string
    website?: string
  }) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .update(contactInfo)
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Error updating contact info:', error)
        throw new Error(`Failed to update contact info: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.updateShopContactInfo error:', error)
      throw error
    }
  }

  /**
   * Update shop social media links
   */
  async updateShopSocialMedia(shopId: string, socialMedia: {
    facebook_url?: string
    twitter_url?: string
    instagram_url?: string
    youtube_url?: string
  }) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .update(socialMedia)
        .eq('id', shopId)
        .select()
        .single()

      if (error) {
        console.error('Error updating social media:', error)
        throw new Error(`Failed to update social media: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('ShopService.updateShopSocialMedia error:', error)
      throw error
    }
  }

  /**
   * Get all shops (for admin purposes)
   */
  async getAllShops() {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all shops:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('ShopService.getAllShops error:', error)
      return []
    }
  }

  /**
   * Search shops by name or location
   */
  async searchShops(query: string) {
    try {
      const { data, error } = await this.supabase
        .from('shops')
        .select('*')
        .or(`shop_name.ilike.%${query}%, shop_city.ilike.%${query}%, shop_province.ilike.%${query}%`)
        .order('shop_name', { ascending: true })

      if (error) {
        console.error('Error searching shops:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('ShopService.searchShops error:', error)
      return []
    }
  }
}

// Export a singleton instance
export const shopService = new ShopService()
