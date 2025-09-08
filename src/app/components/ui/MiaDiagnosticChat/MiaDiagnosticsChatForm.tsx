import { ArrowUp, Loader2, Square } from 'lucide-react'
import { ChangeEvent, FormEvent, forwardRef, KeyboardEvent, memo, useRef, useState } from 'react'

import { Button } from '../../../../components/ui/button'
import { Textarea } from '../../../../components/ui/textarea'
import { cn } from '@/lib/utils'
import { ButtonTooltip } from '../../../../components/ui/ButtonTooltip'
import { VehicleInputData } from './MiaDiagnostics.types'

export interface DiagnosticFormProps {
    /* The ref for the textarea, optional. */
    textAreaRef?: React.RefObject<HTMLTextAreaElement>
    /* The loading state of the form */
    loading: boolean
    /* The disabled state of the form */
    disabled?: boolean
    /* The value of the textarea */
    value?: string
    /* The function to handle the value change */
    onValueChange: (value: ChangeEvent<HTMLTextAreaElement>) => void
    /* The function to handle the form submission */
    onSubmit: (message: string, vehicleData?: VehicleInputData) => void
    /* The function to handle stopping the stream */
    onStop?: () => void
    /* The placeholder of the textarea */
    placeholder?: string
    /* Additional class name for the form wrapper */
    className?: string
    /* If currently editing an existing message */
    isEditing?: boolean
    /* Vehicle information for context */
    vehicleInfo?: VehicleInputData
    /* Function to update vehicle info */
    onVehicleInfoChange?: (vehicleInfo: VehicleInputData) => void
}

const DiagnosticChatFormComponent = forwardRef<HTMLFormElement, DiagnosticFormProps>(
    (
        {
            loading = false,
            disabled = false,
            value = '',
            textAreaRef,
            onValueChange,
            onSubmit,
            onStop,
            placeholder = "Describe the vehicle issue for diagnosis...",
            className,
            isEditing = false,
            vehicleInfo,
            onVehicleInfoChange,
        },
        ref
    ) => {
        const formRef = useRef<HTMLFormElement>(null)
        const [isMobile] = useState(false) // Simplified mobile detection

        const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
            if (event) event.preventDefault()
            if (!value || (loading && !isEditing)) return

            onSubmit(value, vehicleInfo)
        }

        const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSubmit()
            }
        }

        const canSubmit = !loading && !!value

        return (
            <div className="w-full">
                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className={cn(
                        'relative flex items-end gap-2 rounded-lg border border-[#444444] bg-[#1a1a1a] p-2 focus-within:border-[#f52f2f] transition-colors',
                        className
                    )}
                >
                    <Textarea
                        ref={textAreaRef}
                        value={value}
                        onChange={onValueChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled || loading}
                        className={cn(
                            'min-h-[80px] max-h-64 resize-none border-0 bg-transparent p-3 text-white placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0',
                            isMobile ? 'text-base' : 'text-sm'
                        )}
                        rows={3}
                    />

                    <div className="absolute right-1.5 bottom-1.5 flex gap-2 items-center">
                        {/* Submit/Stop Button */}
                        {loading ? (
                            onStop ? (
                                <ButtonTooltip
                                    variant="outline"
                                    aria-label="Stop response"
                                    icon={<Square fill="currentColor" className="scale-75" />}
                                    onClick={onStop}
                                    className="w-7 h-7 rounded-full p-0 text-center flex items-center justify-center border-[#444444] text-white hover:bg-[#333333]"
                                    tooltip={{ content: { side: 'top', text: 'Stop response' } }}
                                />
                            ) : (
                                <Loader2 size={22} className="animate-spin size-7 text-gray-400" strokeWidth={1} />
                            )
                        ) : (
                            <ButtonTooltip
                                type="submit"
                                aria-label="Send message"
                                icon={<ArrowUp />}
                                disabled={!canSubmit}
                                className={cn(
                                    'w-7 h-7 rounded-full p-0 text-center flex items-center justify-center',
                                    !canSubmit 
                                        ? 'opacity-50 bg-[#444444] text-gray-500' 
                                        : 'bg-[#f52f2f] text-white hover:bg-[#f52f2f]/90'
                                )}
                                tooltip={{ content: { side: 'top', text: 'Send message' } }}
                            />
                        )}
                    </div>
                </form>
            </div>
        )
    }
)

DiagnosticChatFormComponent.displayName = 'DiagnosticChatFormComponent'

export const DiagnosticChatForm = memo(DiagnosticChatFormComponent)