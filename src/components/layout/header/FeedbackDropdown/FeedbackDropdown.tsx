import { Lightbulb, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSendFeedbackMutation } from '@/lib/feedback/use-feedback-mutation'

interface FeedbackDropdownProps {
    className?: string
}

export const FeedbackDropdown = ({ className }: FeedbackDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [stage, setStage] = useState<'select' | 'widget'>('select')
    const [feedbackMessage, setFeedbackMessage] = useState('')
    const [feedbackType, setFeedbackType] = useState<'issue' | 'idea'>('idea')

    const sendFeedbackMutation = useSendFeedbackMutation({
        onSuccess: () => {
            setFeedbackMessage('')
            setStage('select')
            setIsOpen(false)
        }
    })

    const handleFeedbackSubmit = async () => {
        if (!feedbackMessage.trim()) return

        sendFeedbackMutation.mutate({
            message: feedbackMessage,
            feedbackType,
            pathname: window.location.pathname,
            userAgent: navigator.userAgent
        })
    }

    const handleIssueClick = () => {
        setFeedbackType('issue')
        setStage('widget')
    }

    const handleIdeaClick = () => {
        setFeedbackType('idea')
        setStage('widget')
    }

    return (
        <Popover open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) setStage('select')
        }}>
            <PopoverTrigger asChild>
                <button className={`text-muted-foreground hover:text-black dark:hover:text-white transition-colors ${className}`}>
                    <Lightbulb className="inline-block w-5 h-5" />
                </button>
            </PopoverTrigger>
            <PopoverContent 
                className="bg-popover text-popover-foreground border-border w-96 p-0"
                side="bottom"
                align="end"
            >
                {stage === 'select' && (
                    <div className="flex flex-col gap-4 p-4">
                        <div className="font-medium text-sm text-foreground">What would you like to share?</div>
                        <div className="flex flex-col gap-3">
                            <Button 
                                className="h-32 bg-secondary hover:bg-accent text-foreground border-border" 
                                onClick={handleIssueClick}
                            >
                                <span className="grid gap-1 text-center">
                                    <HelpCircle size="28" className="mx-auto text-red-400" />
                                    <span className="text-base">Issue</span>
                                    <span className="text-xs text-muted-foreground">with MotorMinds</span>
                                </span>
                            </Button>
                            <Button 
                                className="h-32 bg-secondary hover:bg-accent text-foreground border-border"
                                onClick={handleIdeaClick}
                            >
                                <span className="grid gap-1 text-center">
                                    <Lightbulb size="28" className="mx-auto text-yellow-400" />
                                    <span className="text-base">Idea</span>
                                    <span className="text-xs text-muted-foreground">to improve MotorMinds</span>
                                </span>
                            </Button>
                        </div>
                    </div>
                )}
                {stage === 'widget' && (
                    <div className="flex flex-col gap-4 p-4">
                        <div className="flex items-center justify-between">
                            <div className="font-medium text-sm text-foreground">Share your <span className={feedbackType === 'issue' ? 'text-red-400' : 'text-yellow-400'}>{feedbackType === 'issue' ? 'issue' : 'idea'}</span></div>
                            <button 
                                onClick={() => setStage('select')}
                                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                            >
                                Back
                            </button>
                        </div>
                        <Textarea
                            placeholder={`Tell us about your ${feedbackType}...`}
                            value={feedbackMessage}
                            onChange={(e) => setFeedbackMessage(e.target.value)}
                            className="bg-background text-foreground border-border placeholder:text-muted-foreground min-h-[100px]"
                        />
                        <div className="flex gap-2">
                            <Button 
                                onClick={() => setIsOpen(false)}
                                variant="outline"
                                className="flex-1 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleFeedbackSubmit}
                                disabled={!feedbackMessage.trim() || sendFeedbackMutation.isPending}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                {sendFeedbackMutation.isPending ? 'Sending...' : 'Submit'}
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

export default FeedbackDropdown