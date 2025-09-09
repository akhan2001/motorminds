import { motion } from 'framer-motion'
import { Wrench, Car, AlertTriangle, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { defaultPrompts } from './MiaDiagnostics.prompts'

interface MiaOnboardingProps {
    diagnosticSuggestions?: {
        title?: string
        prompts?: { label: string; description: string }[]
    }
    onValueChange: (value: string) => void
    onFocusInput?: () => void
}

export const MiaOnboarding = ({
    diagnosticSuggestions,
    onValueChange,
    onFocusInput,
}: MiaOnboardingProps) => {
    const prompts = diagnosticSuggestions?.prompts
        ? diagnosticSuggestions.prompts.map((suggestion) => ({
            title: suggestion.label,
            prompt: suggestion.description,
            icon: <Wrench strokeWidth={1.25} size={14} className="!w-4 !h-4" />,
        }))
        : defaultPrompts.map((prompt) => ({
            title: prompt.title,
            prompt: prompt.prompt,
            icon: getIconForPrompt(prompt.title),
        }))

    return (
        <div className="w-full mb-6">
            <div className="px-4 mb-4">
                <h2 className="text-xl font-semibold text-white mb-1">How can I help diagnose your vehicle?</h2>
                <p className="text-gray-400 text-sm">
                    Describe your vehicle issue and I'll provide comprehensive diagnostic insights with technical references and visual aids.
                </p>
            </div>
            <div className="space-y-2">
                {prompts.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left h-auto py-3 px-4 bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] text-gray-300 hover:text-white"
                            onClick={() => {
                                onValueChange(item.prompt)
                                onFocusInput?.()
                            }}
                        >
                            <div className="flex items-start gap-3 w-full">
                                <div className="mt-0.5 text-gray-400">
                                    {item.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="font-medium text-sm">{item.title}</div>
                                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                        {item.prompt.length > 80 ? `${item.prompt.substring(0, 80)}...` : item.prompt}
                                    </div>
                                </div>
                            </div>
                        </Button>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

function getIconForPrompt(title: string) {
    const iconProps = { strokeWidth: 1.25, size: 14, className: "!w-4 !h-4" }
    
    switch (title) {
        case "Engine Won't Start":
            return <Settings {...iconProps} />
        case "Check Engine Light":
            return <AlertTriangle {...iconProps} />
        case "Brake Issues":
            return <Car {...iconProps} />
        case "Transmission Problems":
            return <Settings {...iconProps} />
        case "AC Not Working":
            return <Settings {...iconProps} />
        case "Strange Engine Noise":
            return <Wrench {...iconProps} />
        default:
            return <Wrench {...iconProps} />
    }
}