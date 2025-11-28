import { Eraser, Wrench } from 'lucide-react'

import { ButtonTooltip } from '../../../../components/ui/ButtonTooltip'

interface MiaDiagnosticsHeaderProps {
    isChatLoading: boolean
    onClearMessages: () => void
    onCloseAssistant: () => void
}

export const MiaDiagnosticsHeader = ({
    isChatLoading,
    onClearMessages,
}: MiaDiagnosticsHeaderProps) => {

    return (
        <div className="border-b border-border flex items-center bg-transparent gap-x-4 px-3 h-[46px] rounded-md">
                <div className="text-sm flex-1 flex items-center">
                    <Wrench size={20} className="text-red-600" />
                    <span className="text-foreground font-medium ml-3">MIA Diagnostics</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-x-1">
                    <ButtonTooltip
                        variant="ghost"
                        size="icon"
                        icon={<Eraser strokeWidth={1.5} />}
                        onClick={onClearMessages}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        disabled={isChatLoading}
                        tooltip={{ content: { side: 'bottom', text: 'Clear diagnostic session' } }}
                    />
                </div>
        </div>
    )
}