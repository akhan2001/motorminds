import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { sendPartsRequestEmail } from './parts-request-email-service'
import { SendPartsRequestEmailData, SendPartsRequestEmailVariables } from '../types/parts-request-email'
import { toast } from 'sonner'

export const useSendPartsRequestEmailMutation = (options?: UseMutationOptions<SendPartsRequestEmailData, Error, SendPartsRequestEmailVariables>) => {
    return useMutation({
        mutationFn: sendPartsRequestEmail,
        onSuccess: (data, variables, context) => {
            if (data.success) {
                toast.success('Parts request email sent successfully!')
            } else {
                toast.error(data.error || 'Failed to send parts request email')
            }
            options?.onSuccess?.(data, variables, context)
        },
        onError: (error, variables, context) => {
            console.error('Failed to send parts request email:', error)
            toast.error('Failed to send parts request email')
            options?.onError?.(error, variables, context)
        }
    })
}

