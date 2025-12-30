import { ReactNode } from "react"
import { Control } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { OptInToAIToggle } from "./OptInToAIToggle"
import type { AIOptInFormValues } from "../../../diagnostics/hooks/forms/useAIOptInForm"

interface AIOptInLevelSelectorProps {
    control: Control<AIOptInFormValues>
    disabled?: boolean
    label?: ReactNode
    layout?: 'horizontal' | 'vertical' | 'flex-row-reverse'
}

export const AIOptInLevelSelector = ({
    control,
    disabled,
    label,
    layout = 'vertical'
}: AIOptInLevelSelectorProps) => {
    // TODO: Implement feature flags when ready
    // For now, show all levels
    const AI_OPT_IN_LEVELS = [
        {
            value: 'disabled' as const,
            title: 'Disabled',
            description:
                'You do not consent to sharing any shop data with third-party AI providers. Responses will be generic automotive advice and not tailored to your shop\'s vehicles, work orders, or customer information.',
        },
        {
            value: 'vehicle_only' as const,
            title: 'Vehicle Only',
            description:
                'You consent to sharing vehicle technical data (year, make, model, VIN, specifications) with third-party AI providers. Customer information (names, emails, phones) and work order details will not be shared. Responses will be tailored to vehicle-specific diagnostics and repairs.',
        },
        {
            value: 'vehicle_and_work_orders' as const,
            title: 'Vehicle & Work Orders',
            description:
                'You consent to sharing vehicle data and work order history with third-party AI providers. Customer names and contact information will be anonymized. Responses will be tailored to your vehicle and service history patterns.',
        },
        {
            value: 'full' as const,
            title: 'Full Access',
            description:
                'You consent to sharing all shop data including customer information, vehicle data, work orders, and invoices with third-party AI providers. Responses will be fully personalized with maximum context and assistance.',
        },
    ]

    return (
        <div className="space-y-4">
            {label && (
                <div>
                    <h3 className="text-sm font-medium text-foreground">{label}</h3>
                </div>
            )}
            
            <div className="flex flex-col gap-y-4 my-4 max-w-xl">
                <p className="text-sm text-muted-foreground">
                    MotorMinds AI can provide more relevant answers if you choose to share different levels of
                    data. This feature is powered by third-party AI providers. This is a shop-wide
                    setting, so please select the level of data you are comfortable sharing.
                </p>
                <p className="text-sm text-muted-foreground">
                    For shops with HIPAA compliance enabled, any consented information will only be shared 
                    with third-party AI providers with whom MotorMinds has established a Business Associate 
                    Agreement (BAA).
                </p>
                <OptInToAIToggle />
            </div>

            <div className="max-w-xl">
                <FormField
                    control={control}
                    name="aiOptInLevel"
                    render={({ field }) => (
                        <FormItem>
                            <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={disabled}
                                className="space-y-3"
                            >
                                {AI_OPT_IN_LEVELS.map((item) => (
                                    <div key={item.value} className="flex items-start space-x-3">
                                        <RadioGroupItem
                                            value={item.value}
                                            id={`ai-opt-in-${item.value}`}
                                            className="mt-0.5"
                                        />
                                        <Label
                                            htmlFor={`ai-opt-in-${item.value}`}
                                            className="cursor-pointer flex flex-col flex-1"
                                        >
                                            <span className="text-sm font-medium text-foreground">
                                                {item.title}
                                            </span>
                                            <span className="text-sm text-muted-foreground mt-1">
                                                {item.description}
                                            </span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}