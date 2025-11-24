// src/app/(features)/ai/AIDiagnostics/components/MotorToolDisplay.tsx
'use client'

import React from 'react'
import { Check, AlertCircle, Wrench, Car, Settings, FileText, Clipboard, Clock } from 'lucide-react'

interface ToolDisplayProps {
    toolName: string
    input?: any
    output?: any
    state: 'input-streaming' | 'input-available' | 'output-streaming' | 'output-available' | 'output-error'
}

export function MotorToolDisplay({ toolName, input, output, state }: ToolDisplayProps) {
    // Tool metadata
    const toolMeta = getToolMetadata(toolName)

    // Render based on state
    const isLoading = state === 'input-streaming' || state === 'output-streaming'
    const hasError = state === 'output-error'
    const hasOutput = state === 'output-available' && output

    return (
        <div className="my-3 rounded-lg border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#131313] p-4">
            {/* Tool Header */}
            <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 mt-1">
                    {toolMeta.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{toolMeta.title}</h4>
                        {isLoading && <LoadingSpinner />}
                        {hasError && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500" />}
                        {hasOutput && output?.success && <Check className="w-4 h-4 text-green-600 dark:text-green-500" />}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{toolMeta.description}</p>
                </div>
            </div>

            {/* Tool Input (if available) */}
            {input && state !== 'input-streaming' && (
                <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1a1a1a] rounded px-3 py-2 mb-2">
                    <ToolInput toolName={toolName} input={input} />
                </div>
            )}

            {/* Tool Output */}
            {hasOutput && (
                <div className="mt-3">
                    <ToolOutput toolName={toolName} output={output} />
                </div>
            )}

            {/* Error Display */}
            {hasError && output?.error && (
                <div className="mt-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
                    <p className="font-medium">Error:</p>
                    <p className="text-xs mt-1">{output.error}</p>
                </div>
            )}
        </div>
    )
}

// Tool metadata helper
function getToolMetadata(toolName: string) {
    const metadata: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
        getVehicleInfo: {
            title: 'Vehicle Lookup',
            description: 'Looking up vehicle information by VIN',
            icon: <Car className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        lookupDTC: {
            title: 'DTC Analysis',
            description: 'Analyzing diagnostic trouble codes',
            icon: <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        },
        getServiceProcedure: {
            title: 'Service Procedures',
            description: 'Retrieving repair procedures',
            icon: <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        getParts: {
            title: 'Parts Lookup',
            description: 'Finding required parts and part numbers',
            icon: <Settings className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        getMaintenanceSchedule: {
            title: 'Maintenance Schedule',
            description: 'Checking manufacturer maintenance intervals',
            icon: <Clipboard className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        getSpecifications: {
            title: 'Vehicle Specifications',
            description: 'Retrieving technical specifications',
            icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        getWorkTime: {
            title: 'Labor Time Estimate',
            description: 'Looking up standard labor times',
            icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        getTSB: {
            title: 'Technical Service Bulletins',
            description: 'Searching for TSBs and recalls',
            icon: <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
        },
        getVehicleHistory: {
            title: 'Vehicle History',
            description: 'Retrieving service history from CRM',
            icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        estimateRepairCost: {
            title: 'Cost Estimate',
            description: 'Calculating repair cost estimate',
            icon: <FileText className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        },
        getRecommendedFluids: {
            title: 'Recommended Fluids',
            description: 'Looking up OEM-specified fluids and capacities',
            icon: <Settings className="w-5 h-5 text-blue-600 dark:text-blue-500" />
        }
    }

    return metadata[toolName] || {
        title: toolName,
        description: 'Processing...',
        icon: <Wrench className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
}

// Tool input display
function ToolInput({ toolName, input }: { toolName: string; input: any }) {
    if (toolName === 'getVehicleInfo') {
        return <span>VIN: <span className="font-mono">{input.vin}</span></span>
    }

    if (toolName === 'lookupDTC') {
        return (
            <span>
                Base Vehicle ID: {input.baseVehicleId}
                {input.dtcCode && ` • DTC: ${input.dtcCode}`}
                {input.searchTerm && ` • Search: ${input.searchTerm}`}
                {input.engineId && ` • Engine: ${input.engineId}`}
                {input.submodelId && ` • Submodel: ${input.submodelId}`}
            </span>
        )
    }

    if (toolName === 'getServiceProcedure') {
        return (
            <span>
                Base Vehicle ID: {input.baseVehicleId}
                {input.systemId && ` • System: ${input.systemId}`}
            </span>
        )
    }

    if (toolName === 'getWorkTime') {
        return (
            <span>
                Base Vehicle ID: {input.baseVehicleId}
                {input.searchTerm && ` • Search: ${input.searchTerm}`}
                {input.vmrsCode && ` • VMRS: ${input.vmrsCode}`}
                {input.engineId && ` • Engine: ${input.engineId}`}
                {input.submodelId && ` • Submodel: ${input.submodelId}`}
            </span>
        )
    }

    // Generic input display
    return <span>{JSON.stringify(input)}</span>
}

// Tool output display
function ToolOutput({ toolName, output }: { toolName: string; output: any }) {
    if (!output?.success || !output?.data) {
        return (
            <div className="text-sm text-gray-600 dark:text-gray-400">
                {output?.message || 'No data available'}
            </div>
        )
    }

    // Vehicle Info Output
    if (toolName === 'getVehicleInfo') {
        const vehicle = output.data
        return (
            <div className="text-sm space-y-2">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {vehicle.subModel && <div><span className="text-gray-500 dark:text-gray-400">Trim:</span> {vehicle.subModel}</div>}
                    {vehicle.engineBase && <div><span className="text-gray-500 dark:text-gray-400">Engine:</span> {vehicle.engineBase}</div>}
                    {vehicle.transmissionBase && <div><span className="text-gray-500 dark:text-gray-400">Transmission:</span> {vehicle.transmissionBase}</div>}
                    {vehicle.driveType && <div><span className="text-gray-500 dark:text-gray-400">Drive:</span> {vehicle.driveType}</div>}
                </div>
            </div>
        )
    }

    // DTC Output
    if (toolName === 'lookupDTC') {
        const dtc = output.data
        const applications = dtc?.applications || dtc?.codes || []
        const totalCount = dtc?.totalCount || applications.length

        return (
            <div className="space-y-2">
                {output.message && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{output.message}</div>
                )}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Found {totalCount} DTC application{totalCount === 1 ? '' : 's'}
                    </span>
                </div>
                {applications.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {applications.slice(0, 10).map((app: any, idx: number) => {
                            // Handle both new API structure (app.Item) and legacy (app.code)
                            const code = app.Item?.Code || app.code || 'N/A'
                            const displayName = app.DisplayName || app.description || 'No description available'
                            const isActive = app.IsActive !== undefined ? app.IsActive : true
                            const applicationId = app.ApplicationID || app.id

                            return (
                                <div
                                    key={idx}
                                    className="border-l-2 border-yellow-600 dark:border-yellow-500 pl-3 py-2 bg-white dark:bg-[#1a1a1a] rounded"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-gray-900 dark:text-gray-100 font-mono">
                                            {code}
                                        </div>
                                        {!isActive && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full">
                                                Superseded
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        {displayName}
                                    </div>
                                    {applicationId && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Application ID: {applicationId}
                                        </div>
                                    )}
                                    {app.AttributeMappings && app.AttributeMappings.length > 0 && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Attributes: {app.AttributeMappings.map((m: any) => `${m.Type}:${m.ID}`).join(', ')}
                                        </div>
                                    )}
                                    {app.Links && app.Links.length > 0 && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            {app.Links.map((link: any) => link.Rel).join(', ')} available
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {applications.length > 10 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                ... and {applications.length - 10} more
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-[#1a1a1a] rounded px-3 py-2">
                        No DTC applications found for this vehicle configuration.
                    </div>
                )}
            </div>
        )
    }

    // Work Time Output
    if (toolName === 'getWorkTime') {
        const workTimes = output.data
        const applications = workTimes?.applications || workTimes?.workTimes || []
        const totalCount = workTimes?.totalCount || applications.length

        return (
            <div className="space-y-2">
                {output.message && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{output.message}</div>
                )}
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Found {totalCount} work time application{totalCount === 1 ? '' : 's'}
                    </span>
                </div>
                {applications.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {applications.slice(0, 10).map((app: any, idx: number) => {
                            const displayName = app.DisplayName || app.operationDescription || 'Work Time'
                            const items = app.Items || []
                            const taxonomy = app.Taxonomy
                            const isActive = app.IsActive !== undefined ? app.IsActive : true

                            return (
                                <div
                                    key={idx}
                                    className="border-l-2 border-blue-600 dark:border-blue-500 pl-3 py-2 bg-white dark:bg-[#1a1a1a] rounded"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                                {displayName}
                                            </div>
                                            {taxonomy && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {taxonomy.SystemName && `${taxonomy.SystemName}`}
                                                    {taxonomy.GroupName && ` • ${taxonomy.GroupName}`}
                                                </div>
                                            )}
                                        </div>
                                        {!isActive && (
                                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full">
                                                Superseded
                                            </span>
                                        )}
                                    </div>

                                    {items.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {items.map((item: any, itemIdx: number) => (
                                                <div key={itemIdx} className="bg-gray-50 dark:bg-[#0f0f0f] rounded p-2 text-xs">
                                                    <div className="grid grid-cols-2 gap-2 mb-1">
                                                        {item.BaseLaborTime > 0 && (
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Base Labor:</span>{' '}
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.BaseLaborTime} {item.LaborTimeInterval || 'Hours'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.AdditionalLaborTime > 0 && (
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Additional:</span>{' '}
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.AdditionalLaborTime} {item.LaborTimeInterval || 'Hours'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.AllLaborTime > 0 && (
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">All Labor:</span>{' '}
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.AllLaborTime} {item.LaborTimeInterval || 'Hours'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.RequiredSkill && (
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Skill:</span>{' '}
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.RequiredSkill.Name} ({item.RequiredSkill.Code})
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.ServiceType && (
                                                            <div>
                                                                <span className="text-gray-500 dark:text-gray-400">Type:</span>{' '}
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {item.ServiceType}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.Notes && item.Notes.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
                                                            {item.Notes.map((note: any, noteIdx: number) => (
                                                                <div key={noteIdx} className="text-xs text-gray-600 dark:text-gray-400 italic">
                                                                    {note.Text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {app.Position && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            <span className="font-medium">Position:</span> {app.Position.Name}
                                        </div>
                                    )}

                                    {app.Links && app.Links.length > 0 && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            {app.Links.map((link: any) => link.Rel).join(', ')} available
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {applications.length > 10 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                ... and {applications.length - 10} more
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-[#1a1a1a] rounded px-3 py-2">
                        No work time applications found for this vehicle configuration.
                    </div>
                )}
            </div>
        )
    }

    // Recommended Fluids Output
    if (toolName === 'getRecommendedFluids') {
        const fluids = output.data

        // Handle case where data might be undefined or applications is empty
        const hasFluids = fluids?.applications && Array.isArray(fluids.applications) && fluids.applications.length > 0

        return (
            <div className="space-y-2">
                {output.message && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">{output.message}</div>
                )}
                {hasFluids ? (
                    <div className="space-y-3">
                        {fluids.applications.map((fluid: any, idx: number) => (
                            <div key={idx} className="border-l-2 border-blue-600 dark:border-blue-500 pl-3 py-2 bg-white dark:bg-[#1a1a1a] rounded">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                            {fluid.displayName || fluid.fluidType || 'Fluid'}
                                        </div>
                                        {fluid.taxonomy?.commonName && fluid.taxonomy.commonName !== fluid.fluidType && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {fluid.taxonomy.commonName}
                                            </div>
                                        )}
                                    </div>
                                    {fluid.isActive === false && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">Superseded</span>
                                    )}
                                </div>

                                {fluid.positionDescription && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="font-medium">Position:</span> {fluid.positionDescription}
                                        {fluid.positionType && ` (${fluid.positionType})`}
                                    </div>
                                )}

                                {(fluid.specification || fluid.capacity) && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                        {fluid.specification && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Specification:</span>{' '}
                                                <span className="text-gray-900 dark:text-gray-100 font-medium">{fluid.specification}</span>
                                            </div>
                                        )}
                                        {fluid.capacity && (
                                            <div>
                                                <span className="text-gray-500 dark:text-gray-400">Capacity:</span>{' '}
                                                <span className="text-gray-900 dark:text-gray-100 font-medium">{fluid.capacity}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {fluid.taxonomy && (
                                    <div className="mt-2 text-xs space-y-0.5">
                                        {fluid.taxonomy.systemName && (
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <span className="font-medium">System:</span> {fluid.taxonomy.systemName}
                                            </div>
                                        )}
                                        {fluid.taxonomy.groupName && (
                                            <div className="text-gray-500 dark:text-gray-400">
                                                <span className="font-medium">Group:</span> {fluid.taxonomy.groupName}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {fluid.qualifiers && fluid.qualifiers.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
                                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qualifiers:</div>
                                        <div className="space-y-1">
                                            {fluid.qualifiers.filter((q: any) => q.isActive).map((qualifier: any, qIdx: number) => (
                                                <div key={qIdx} className="text-xs text-gray-600 dark:text-gray-400">
                                                    • {qualifier.description}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-100 dark:bg-[#1a1a1a] rounded px-3 py-2">
                        {fluids?.totalCount === 0
                            ? 'No fluid specifications found for this vehicle configuration. The vehicle may not have fluid data available in MOTOR DaaS.'
                            : 'No fluid data available'}
                    </div>
                )}
            </div>
        )
    }

    // Generic success message
    return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
            {output.message || 'Data retrieved successfully'}
        </div>
    )
}

// Loading spinner component
function LoadingSpinner() {
    return (
        <svg
            className="animate-spin h-4 w-4 text-red-600 dark:text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    )
}

// Helper to check if tool name is a MOTOR tool
export function isMotorTool(toolName: string): boolean {
    const motorTools = [
        'getVehicleInfo',
        'lookupDTC',
        'getServiceProcedure',
        'getParts',
        'getMaintenanceSchedule',
        'getSpecifications',
        'getWorkTime',
        'getTSB',
        'getWiringDiagrams',
        'getBulkVehicleAttributes',
        'getRecommendedFluids',
        'getVehicleHistory',
        'estimateRepairCost'
    ]
    return motorTools.includes(toolName)
}

