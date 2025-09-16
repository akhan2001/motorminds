import { useState, useCallback } from 'react'
import { decodeVin } from '@/app/utils/vin-decode'
import { MakeModelSelection } from '@/components/ui/make-model-selector'

export const useVinDecoder = () => {
    const [vinInput, setVinInput] = useState('')
    const [vinDecoding, setVinDecoding] = useState(false)
    const [vinDecodeError, setVinDecodeError] = useState<string | null>(null)
    const [vinDecodeSuccess, setVinDecodeSuccess] = useState<string | null>(null)
    const [showVinInput, setShowVinInput] = useState(false)

    const handleVinDecode = useCallback(async (
        onVehicleDecoded?: (selection: MakeModelSelection) => void,
        onSessionUpdate?: (context: any) => void
    ) => {
        if (!vinInput.trim()) {
            setVinDecodeError('Please enter a VIN number')
            return
        }

        setVinDecoding(true)
        setVinDecodeError(null)
        setVinDecodeSuccess(null)

        try {
            const decodedVehicle = await decodeVin(vinInput.trim())
            
            if (decodedVehicle) {
                // Auto-populate the vehicle selection with decoded information
                const newSelection: MakeModelSelection = {
                    make: decodedVehicle.make || '',
                    manufacturerId: null, // Will be resolved by MakeModelSelector
                    model: decodedVehicle.model || '',
                    modelId: null, // Will be resolved by MakeModelSelector
                    year: decodedVehicle.year || ''
                }

                if (onVehicleDecoded) {
                    onVehicleDecoded(newSelection)
                }

                setVinDecodeSuccess(`Successfully decoded VIN: ${decodedVehicle.year} ${decodedVehicle.make} ${decodedVehicle.model}${decodedVehicle.engine ? ` (${decodedVehicle.engine})` : ''}`)
                
                // Clear VIN input and hide VIN section
                setVinInput('')
                setShowVinInput(false)

                // Update session context with VIN decode information
                if (onSessionUpdate) {
                    onSessionUpdate({
                        year: parseInt(decodedVehicle.year) || undefined,
                        make: decodedVehicle.make || undefined,
                        model: decodedVehicle.model || undefined,
                        vin: vinInput.trim(),
                        vin_engine: decodedVehicle.engine || undefined,
                        vin_trim: decodedVehicle.trim || undefined,
                        vin_drivetrain: decodedVehicle.drivetrain || undefined
                    })
                }
            }
        } catch (error) {
            console.error('VIN decode error:', error)
            setVinDecodeError(error instanceof Error ? error.message : 'Failed to decode VIN. Please check the VIN and try again.')
        } finally {
            setVinDecoding(false)
        }
    }, [vinInput])

    const clearVinSuccess = useCallback(() => {
        setVinDecodeSuccess(null)
    }, [])

    return {
        vinInput,
        setVinInput,
        vinDecoding,
        vinDecodeError,
        setVinDecodeError,
        vinDecodeSuccess,
        setVinDecodeSuccess,
        showVinInput,
        setShowVinInput,
        handleVinDecode,
        clearVinSuccess
    }
}
