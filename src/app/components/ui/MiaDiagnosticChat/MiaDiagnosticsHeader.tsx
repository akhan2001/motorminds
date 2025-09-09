import { Eraser, X, Wrench, Car } from 'lucide-react'

import { ButtonTooltip } from '../../../../components/ui/ButtonTooltip'
import { VehicleInputData } from './MiaDiagnostics.types'

interface MiaDiagnosticsHeaderProps {
    isChatLoading: boolean
    onClearMessages: () => void
    onCloseAssistant: () => void
    vehicleInfo?: VehicleInputData
}

export const MiaDiagnosticsHeader = ({
    isChatLoading,
    onClearMessages,
    vehicleInfo,
}: MiaDiagnosticsHeaderProps) => {
    const getVehicleDisplay = () => {
        if (!vehicleInfo) return 'Select Vehicle'
        
        const parts = []
        if (vehicleInfo.year) parts.push(vehicleInfo.year)
        if (vehicleInfo.make) parts.push(vehicleInfo.make)
        if (vehicleInfo.model) parts.push(vehicleInfo.model)
        
        return parts.length > 0 ? parts.join(' ') : 'Select Vehicle'
    }

    return (
        <div className="border-b border-[#444444] flex items-center bg-black gap-x-4 px-3 h-[46px] rounded-md">
                <div className="text-sm flex-1 flex items-center">
                    <Wrench size={20} className="text-[#f52f2f]" />
                    <span className="text-white font-medium ml-3">MIA Diagnostics</span>
                    
                    {/* Vehicle Info Display */}
                    <div className="ml-4 flex items-center gap-2 text-xs">
                        <Car size={14} className="text-gray-400" />
                        <span className="text-gray-300">{getVehicleDisplay()}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-x-1">
                    <ButtonTooltip
                        variant="ghost"
                        size="icon"
                        icon={<Eraser strokeWidth={1.5} />}
                        onClick={onClearMessages}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        disabled={isChatLoading}
                        tooltip={{ content: { side: 'bottom', text: 'Clear diagnostic session' } }}
                    />
                </div>
        </div>
    )
}