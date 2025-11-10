import { createClient } from '@/lib/supabase'
import type { StatusTrackerPreset, StatusTrackerPresetCreateData } from '../types/status-tracker'
import { v4 as uuidv4 } from 'uuid'
import { MAX_STATUS_TRACKERS } from './status-tracker-constants'

export class StatusTrackerService {
    private supabase = createClient()

    /**
     * Get status tracker presets for a shop
     */
    async getStatusTrackerPresets(shopId: string): Promise<StatusTrackerPreset[]> {
        const { data, error } = await this.supabase
            .from('shops')
            .select('status_tracker_presets')
            .eq('id', shopId)
            .single()

        if (error) {
            console.error('Error fetching status tracker presets:', error)
            throw new Error(`Failed to fetch status tracker presets: ${error.message}`)
        }

        // Return presets array or empty array
        const presets = data?.status_tracker_presets || []
        return Array.isArray(presets) ? presets : []
    }

    /**
     * Add a new status tracker preset
     */
    async addStatusTrackerPreset(shopId: string, presetData: StatusTrackerPresetCreateData): Promise<StatusTrackerPreset> {
        // Get current presets
        const currentPresets = await this.getStatusTrackerPresets(shopId)

        // Check if limit is reached
        if (currentPresets.length >= MAX_STATUS_TRACKERS) {
            throw new Error(`Maximum of ${MAX_STATUS_TRACKERS} status trackers allowed. Please delete one before creating a new one.`)
        }

        // Create new preset with ID
        const newPreset: StatusTrackerPreset = {
            id: uuidv4(),
            name: presetData.name,
            color: presetData.color,
            display_order: presetData.display_order ?? currentPresets.length,
        }

        // Add to array
        const updatedPresets = [...currentPresets, newPreset]

        // Update shops table
        const { error } = await this.supabase
            .from('shops')
            .update({ status_tracker_presets: updatedPresets })
            .eq('id', shopId)

        if (error) {
            console.error('Error adding status tracker preset:', error)
            throw new Error(`Failed to add status tracker preset: ${error.message}`)
        }

        return newPreset
    }

    /**
     * Update a status tracker preset
     */
    async updateStatusTrackerPreset(
        shopId: string,
        presetId: string,
        updates: Partial<StatusTrackerPresetCreateData>
    ): Promise<StatusTrackerPreset> {
        // Get current presets
        const currentPresets = await this.getStatusTrackerPresets(shopId)

        // Find and update preset
        const updatedPresets = currentPresets.map(preset =>
            preset.id === presetId
                ? { ...preset, ...updates }
                : preset
        )

        // Update shops table
        const { error } = await this.supabase
            .from('shops')
            .update({ status_tracker_presets: updatedPresets })
            .eq('id', shopId)

        if (error) {
            console.error('Error updating status tracker preset:', error)
            throw new Error(`Failed to update status tracker preset: ${error.message}`)
        }

        const updatedPreset = updatedPresets.find(p => p.id === presetId)
        if (!updatedPreset) {
            throw new Error('Preset not found after update')
        }

        return updatedPreset
    }

    /**
     * Delete a status tracker preset
     */
    async deleteStatusTrackerPreset(shopId: string, presetId: string): Promise<void> {
        // Get current presets
        const currentPresets = await this.getStatusTrackerPresets(shopId)

        // Remove preset
        const updatedPresets = currentPresets.filter(preset => preset.id !== presetId)

        // Update shops table
        const { error } = await this.supabase
            .from('shops')
            .update({ status_tracker_presets: updatedPresets })
            .eq('id', shopId)

        if (error) {
            console.error('Error deleting status tracker preset:', error)
            throw new Error(`Failed to delete status tracker preset: ${error.message}`)
        }
    }

    /**
     * Reorder status tracker presets
     */
    async reorderStatusTrackerPresets(shopId: string, presetIds: string[]): Promise<void> {
        // Get current presets
        const currentPresets = await this.getStatusTrackerPresets(shopId)

        // Create a map for quick lookup
        const presetMap = new Map(currentPresets.map(p => [p.id, p]))

        // Reorder based on provided IDs
        const reorderedPresets = presetIds
            .map(id => presetMap.get(id))
            .filter((p): p is StatusTrackerPreset => p !== undefined)

        // Add any presets not in the reorder list (shouldn't happen, but safety)
        const remainingIds = new Set(presetIds)
        const remainingPresets = currentPresets.filter(p => !remainingIds.has(p.id))
        const finalPresets = [...reorderedPresets, ...remainingPresets]

        // Update display_order
        const finalPresetsWithOrder = finalPresets.map((preset, index) => ({
            ...preset,
            display_order: index,
        }))

        // Update shops table
        const { error } = await this.supabase
            .from('shops')
            .update({ status_tracker_presets: finalPresetsWithOrder })
            .eq('id', shopId)

        if (error) {
            console.error('Error reordering status tracker presets:', error)
            throw new Error(`Failed to reorder status tracker presets: ${error.message}`)
        }
    }
}

export const statusTrackerService = new StatusTrackerService()

