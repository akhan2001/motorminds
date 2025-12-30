import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

// Shared schema definition
export const AIOptInSchema = z.object({
    aiOptInLevel: z.enum(['vehicle_only', 'vehicle_and_work_orders', 'full'], {
        required_error: 'AI Opt-in level selection is required',
    }),
})

export type AIOptInFormValues = z.infer<typeof AIOptInSchema>

/**
 * Hook to manage the AI Opt-In form state and submission logic.
 * TODO: Implement actual shop settings update functionality
 * Optionally takes an onSuccess callback (e.g., to close a modal).
 */
export const useAIOptInForm = (onSuccessCallback?: () => void) => {
    // TODO: Get shop settings and current opt-in level
    // const { data: shopSettings } = useShopSettings(shopId)

    const form = useForm<AIOptInFormValues>({
        resolver: zodResolver(AIOptInSchema),
        defaultValues: {
            aiOptInLevel: 'vehicle_only', // TODO: Get from shop settings
        },
    })

    const onSubmit = async (values: AIOptInFormValues) => {
        // TODO: Implement shop settings update
        // For now, just log the values
        console.log('AI Opt-in level selected:', values.aiOptInLevel)

        // TODO: Update shop settings in database
        // await updateShopSettings(shopId, { ai_opt_in_level: values.aiOptInLevel })

        onSuccessCallback?.()
    }

    return {
        form,
        onSubmit,
        isUpdating: false, // TODO: Track actual loading state
        currentOptInLevel: 'vehicle_only' as const, // TODO: Get from shop settings
    }
}
