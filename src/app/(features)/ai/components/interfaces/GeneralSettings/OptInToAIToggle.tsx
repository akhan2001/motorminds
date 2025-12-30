import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

export const OptInToAIToggle = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-fit">
                    Learn more about data privacy
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#0a0a0a] border-border dark:border-[#2a2a2a] sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Data Privacy and MotorMinds AI</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-y-4 text-sm text-muted-foreground">
                    <p>
                        MotorMinds AI utilizes third-party AI providers designed with a strong focus on data
                        privacy and security.
                    </p>

                    <p>
                        By default, no shop data is shared with third-party AI providers. With your permission,
                        MotorMinds may share vehicle technical data, work order history, and customer information
                        with these providers based on your selected opt-in level. MotorMinds configures third-party 
                        AI providers to process data transiently and not use it for model training, in accordance 
                        with our agreements and provider policies.
                    </p>

                    <p>
                        <strong>Important:</strong> MotorMinds AI does not generate, rewrite, or replace OEM service 
                        procedures. OEM information is retrieved verbatim from licensed sources and presented separately 
                        from AI-generated guidance. AI responses are intended as diagnostic guidance only. Technicians 
                        should always refer to OEM procedures for complete and authoritative instructions.
                    </p>

                    <p>
                        For organizations that handle regulated personal or health-related information and have enabled 
                        enhanced compliance controls, MotorMinds will only share consented data with AI providers under 
                        appropriate contractual safeguards (e.g., BAAs where applicable).
                    </p>

                    <p>
                        For more detailed information about how we collect and use your data, see our{' '}
                        <Link
                            href="https://motorminds.ca/privacy-policy"
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Privacy Policy
                        </Link>. You can choose which types of information you consent to share by selecting
                        from the options in the AI settings.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
