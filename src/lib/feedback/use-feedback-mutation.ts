import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { sendFeedback } from './feedback-service'
import { SendFeedbackData, SendFeedbackVariables } from '../types/feedback'
import { toast } from 'sonner'

export const useSendFeedbackMutation = (options?: UseMutationOptions<SendFeedbackData, Error, SendFeedbackVariables>) => {
    return useMutation({
        mutationFn: sendFeedback,
        onSuccess: (data, variables, context) => {
            if (data.success) {
                toast.success('Feedback sent successfully!')
            } else {
                toast.error(data.error || 'Failed to send feedback')
            }
            options?.onSuccess?.(data, variables, context)
        },
        onError: (error, variables, context) => {
            console.error('Failed to send feedback:', error)
            toast.error('Failed to send feedback')
            options?.onError?.(error, variables, context)
        }
    })
}