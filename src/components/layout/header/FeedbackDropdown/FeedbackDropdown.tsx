import { Lightbulb, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface FeedbackDropdownProps {
    className?: string
}

export const FeedbackDropdown = ({ className }: FeedbackDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [stage, setStage] = useState<'select' | 'widget'>('select')
    const [feedbackMessage, setFeedbackMessage] = useState('')

    const handleFeedbackSubmit = async () => {
        try {
            // Here you would typically send the feedback to your backend
            console.log('Feedback submitted:', feedbackMessage)
            // Reset form
            setFeedbackMessage('')
            setStage('select')
            setIsOpen(false)
            // You could add a toast notification here
        } catch (error) {
            console.error('Error submitting feedback:', error)
        }
    }

    const handleSupportClick = () => {
        window.open("https://www.motorminds.ca/contact-us", "_blank")
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) setStage('select')
        }}>
            <PopoverTrigger asChild>
                <button className={`text-[#979797] hover:text-white transition-colors ${className}`}>
                    <Lightbulb className="inline-block w-5 h-5" />
                </button>
            </PopoverTrigger>
            <PopoverContent 
                className="bg-[#0d0d0d] text-white border-[#1f1f1f] w-96 p-0"
                side="bottom"
                align="end"
            >
                {stage === 'select' && (
                    <div className="flex flex-col gap-4 p-4">
                        <div className="font-medium text-sm text-white">What would you like to share?</div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                className="h-32 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white border-[#333333]" 
                                onClick={handleSupportClick}
                            >
                                <span className="grid gap-1 text-center">
                                    <HelpCircle size="28" className="mx-auto text-red-400" />
                                    <span className="text-base">Issue</span>
                                    <span className="text-xs text-gray-400">with my project</span>
                                </span>
                            </Button>
                            <Button 
                                className="h-32 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white border-[#333333]"
                                onClick={() => setStage('widget')}
                            >
                                <span className="grid gap-1 text-center">
                                    <Lightbulb size="28" className="mx-auto text-yellow-400" />
                                    <span className="text-base">Idea</span>
                                    <span className="text-xs text-gray-400">to improve MotorMinds</span>
                                </span>
                            </Button>
                        </div>
                    </div>
                )}
                {stage === 'widget' && (
                    <div className="flex flex-col gap-4 p-4">
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-white">Share your idea</div>
                            <button 
                                onClick={() => setStage('select')}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                Back
                            </button>
                        </div>
                        <Textarea
                            placeholder="Tell us how we can improve Motorminds..."
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            className="bg-[#1f1f1f] border-[#333333] text-white placeholder-gray-400 min-h-[100px]"
                        />
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => setIsOpen(false)}
                                variant="outline"
                                className="flex-1 border-[#333333] text-gray-300 hover:bg-[#2a2a2a]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleFeedbackSubmit}
                                disabled={!feedbackMessage.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export default FeedbackDropdown