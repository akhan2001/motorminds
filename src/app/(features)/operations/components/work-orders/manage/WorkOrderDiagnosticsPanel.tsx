'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useCreateDiagnosticSession } from '@/app/(features)/ai/diagnostics/hooks/use-diagnostic-sessions'
import { useMotorEnginesQuery } from '@/app/(features)/ai/diagnostics/data/motor/engines-query'
import type { SandboxVehicle } from '@/app/(features)/ai/diagnostics/components/VehicleSelector'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import { AlertCircle, Loader2, Wrench, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MOTOR_SANDBOX_VEHICLES } from '@/app/(features)/ai/diagnostics/data/motorSandboxVehicles'

// Lazy load the heavy diagnostics panel
const AIDiagnosticsPanel = dynamic(
    () => import('@/app/(features)/ai/diagnostics/components/AIDiagnosticsPanel').then(m => ({ default: m.AIDiagnosticsPanel })),
    { 
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full bg-card dark:bg-[#131313]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }
)

interface WorkOrderDiagnosticsPanelProps {
    workOrder: WorkOrderWithDetails
    shopId: string
    className?: string
}

export function WorkOrderDiagnosticsPanel({
    workOrder,
    shopId,
    className = ''
}: WorkOrderDiagnosticsPanelProps) {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [isCreatingSession, setIsCreatingSession] = useState(false)
    const [sessionError, setSessionError] = useState<string | null>(null)
    const [selectedEngine, setSelectedEngine] = useState<{
        id: number
        name: string
        data: any
    } | null>(null)
    const createSession = useCreateDiagnosticSession(shopId)

    // Try to find matching sandbox vehicle
    const sandboxVehicle = React.useMemo(() => {
        if (!workOrder.vehicle) return null

        const vehicle = workOrder.vehicle

        // Try to match by VIN first (most accurate)
        if (vehicle.vin) {
            const vinMatch = MOTOR_SANDBOX_VEHICLES.find(
                sv => sv.vin?.toUpperCase() === vehicle.vin?.toUpperCase()
            )
            if (vinMatch) return vinMatch
        }

        // Fallback to year/make/model match
        return MOTOR_SANDBOX_VEHICLES.find(
            sv => sv.year === vehicle.year &&
                  sv.make?.toLowerCase() === vehicle.make?.toLowerCase() &&
                  sv.model?.toLowerCase() === vehicle.model?.toLowerCase()
        )
    }, [workOrder.vehicle])

    // Use base_vehicle_id from database or sandbox vehicle
    const effectiveBaseVehicleId = workOrder.vehicle?.base_vehicle_id || sandboxVehicle?.baseVehicleId

    // Fetch available engines using year/make/model IDs (same approach as YMMESelector)
    const { data: availableEngines, isLoading: isLoadingEngines } = useMotorEnginesQuery(
        {
            year: workOrder.vehicle?.year || 0,
            makeID: workOrder.vehicle?.make_id || 0,
            modelID: workOrder.vehicle?.model_id || 0,
        },
        {
            enabled: !!(workOrder.vehicle?.year && workOrder.vehicle?.make_id && workOrder.vehicle?.model_id)
        }
    )


    // Extract vehicle context from work order with selected engine
    const vehicleContext: SandboxVehicle | null = React.useMemo(() => {
        if (!workOrder.vehicle) return null

        const vehicle = workOrder.vehicle

        return {
            motorId: sandboxVehicle?.motorId || parseInt(vehicle.id || '0', 10) || undefined,
            year: vehicle.year || 0,
            make: vehicle.make || '',
            model: vehicle.model || '',
            vin: vehicle.vin,
            baseVehicleId: effectiveBaseVehicleId, // Use effective base vehicle ID
            engineId: selectedEngine?.id || vehicle.engine_id, // Use selected engine
            engineName: selectedEngine?.name || vehicle.engine_name,
            engineData: selectedEngine?.data, // Include full engine response
            makeID: vehicle.make_id,
            modelID: vehicle.model_id,
        }
    }, [workOrder.vehicle, selectedEngine, effectiveBaseVehicleId, sandboxVehicle])

    // Lazy session creation handler
    const handleCreateSession = async () => {
        if (!vehicleContext || isCreatingSession || sessionId) return

        setIsCreatingSession(true)
        setSessionError(null)
        try {
            const newSession = await createSession.mutateAsync({
                vehicle_context: vehicleContext,
                work_order_id: workOrder.id,
                initial_issue: workOrder.notes || undefined,
                status: 'active',
            })
            setSessionId(newSession.session_id)
        } catch (error) {
            console.error('Failed to create diagnostics session:', error)
            setSessionError(error instanceof Error ? error.message : 'Failed to start diagnostics session')
        } finally {
            setIsCreatingSession(false)
        }
    }

    // Retry handler for session creation failure
    const handleRetry = () => {
        setSessionError(null)
        handleCreateSession()
    }

    // Missing vehicle data
    if (!vehicleContext || !vehicleContext.year || !vehicleContext.make || !vehicleContext.model) {
        return (
            <div className={`flex flex-col items-center justify-center h-full bg-card dark:bg-[#131313] p-6 ${className}`}>
                <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Vehicle Information Incomplete</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                    AI Diagnostics requires complete vehicle information (Year, Make, Model).
                </p>
                <p className="text-xs text-muted-foreground text-center">
                    Please update the vehicle details in the left panel to enable diagnostics.
                </p>
            </div>
        )
    }

    // Session creation error state
    if (sessionError) {
        return (
            <div className={`flex flex-col items-center justify-center h-full bg-card dark:bg-[#131313] p-6 ${className}`}>
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Session Creation Failed</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                    {sessionError}
                </p>
                <Button 
                    onClick={handleRetry}
                    variant="outline"
                >
                    Try Again
                </Button>
            </div>
        )
    }

    // Show engine selector if engines are available (changed from > 1 to > 0 to show for single engines too)
    if (!sessionId && !isCreatingSession && availableEngines && availableEngines.length > 0 && !selectedEngine) {
        return (
            <div className={`flex flex-col items-center justify-center h-full bg-card dark:bg-[#131313] p-6 overflow-y-auto ${className}`}>
                <div className="text-center max-w-2xl w-full">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Wrench className="h-8 w-8 text-blue-500" />
                        <Sparkles className="h-6 w-6 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        {availableEngines.length > 1 ? 'Select Engine Configuration' : 'Confirm Engine Configuration'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        {availableEngines.length > 1
                            ? 'This vehicle has multiple engine options. Please select the correct engine configuration for accurate diagnostics.'
                            : 'Please confirm the engine configuration for this vehicle to ensure accurate diagnostics.'}
                    </p>

                    {isLoadingEngines ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading engine options...</span>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {availableEngines.map((engine) => {
                                const engineName = engine.Description ||
                                    `${engine.CylinderLiter}L ${engine.Designation || ''} ${engine.Cylinders || ''} cyl`.trim()

                                return (
                                    <button
                                        key={engine.EngineID}
                                        onClick={() => setSelectedEngine({
                                            id: engine.EngineID,
                                            name: engineName,
                                            data: engine
                                        })}
                                        className="w-full p-4 text-left border border-border rounded-lg hover:bg-accent hover:border-blue-500 transition-all group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                                                    {engineName}
                                                </p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {engine.CylinderLiter && (
                                                        <span className="text-xs px-2 py-1 bg-muted rounded">
                                                            {engine.CylinderLiter}L
                                                        </span>
                                                    )}
                                                    {engine.Cylinders && (
                                                        <span className="text-xs px-2 py-1 bg-muted rounded">
                                                            {engine.Cylinders} cyl
                                                        </span>
                                                    )}
                                                    {engine.FuelType && (
                                                        <span className="text-xs px-2 py-1 bg-muted rounded">
                                                            {engine.FuelType}
                                                        </span>
                                                    )}
                                                    {engine.HorsePower && (
                                                        <span className="text-xs px-2 py-1 bg-muted rounded">
                                                            {engine.HorsePower} HP
                                                        </span>
                                                    )}
                                                    {engine.Aspiration && (
                                                        <span className="text-xs px-2 py-1 bg-muted rounded">
                                                            {engine.Aspiration}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Check className="h-5 w-5 text-transparent group-hover:text-blue-600 transition-colors" />
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                        Selecting the correct engine ensures accurate wiring diagrams and service procedures from MOTOR DaaS.
                    </p>
                </div>
            </div>
        )
    }

    // Show activation prompt before session is created
    if (!sessionId && !isCreatingSession) {
        return (
            <div className={`flex flex-col items-center justify-center h-full bg-card dark:bg-[#131313] p-6 ${className}`}>
                <div className="text-center max-w-md">
                    <h3 className="text-lg font-semibold text-foreground mb-2">AI Diagnostics</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Get AI-powered diagnostic assistance for this work order. Access MOTOR DaaS wiring diagrams,
                        service procedures, and real-time research.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                        <p className="text-xs text-muted-foreground mb-2">Vehicle:</p>
                        <p className="text-sm font-medium text-foreground">
                            {vehicleContext.year} {vehicleContext.make} {vehicleContext.model}
                        </p>
                        {vehicleContext.engineName && (
                            <p className="text-xs text-muted-foreground mt-1">{vehicleContext.engineName}</p>
                        )}
                        {vehicleContext.vin && (
                            <p className="text-xs text-muted-foreground mt-1">VIN: ...{vehicleContext.vin.slice(-8)}</p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {availableEngines && availableEngines.length > 1 && (
                            <Button
                                onClick={() => setSelectedEngine(null)}
                                variant="outline"
                                className="flex-1"
                            >
                                Change Engine
                            </Button>
                        )}
                        <Button
                            onClick={handleCreateSession}
                            className="bg-blue-600 hover:bg-blue-700 flex-1"
                        >
                            Start Diagnostics Session
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // Loading state
    if (isCreatingSession) {
        return (
            <div className={`flex flex-col items-center justify-center h-full bg-card dark:bg-[#131313] p-6 ${className}`}>
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p className="text-sm text-muted-foreground">Starting diagnostics session...</p>
            </div>
        )
    }

    // Active diagnostics panel
    return (
        <div className={`h-full flex flex-col ${className}`}>
            {/* AI Diagnostics Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#222222] bg-gray-50 dark:bg-[#131313] px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                AI Diagnostics
                            </h2>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {vehicleContext.year} {vehicleContext.make} {vehicleContext.model}
                            </p>
                            {vehicleContext.engineName && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {vehicleContext.engineName}
                                </p>
                            )}
                            {vehicleContext.vin && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    VIN: ...{vehicleContext.vin.slice(-8)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            Active
                        </span>
                    </div>
                </div>
            </div>

            {/* Diagnostics Panel */}
            <div className="flex-1 min-h-0">
                <AIDiagnosticsPanel
                    shopId={shopId}
                    sessionId={sessionId || undefined}
                    workOrderId={workOrder.id}
                    vehicleId={workOrder.vehicle_id ? parseInt(workOrder.vehicle_id, 10) : undefined}
                    baseVehicleId={vehicleContext.baseVehicleId}
                    vehicleContext={vehicleContext}
                    reportedIssue={workOrder.notes || undefined}
                    className="h-full"
                />
            </div>
        </div>
    )
}

