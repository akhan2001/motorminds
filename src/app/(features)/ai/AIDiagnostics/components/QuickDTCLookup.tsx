// src/app/(features)/ai/AIDiagnostics/components/QuickDTCLookup.tsx
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Search, AlertCircle } from 'lucide-react'

interface QuickDTCLookupProps {
    baseVehicleId?: number
    onResultClick?: (dtcCode: string) => void
}

export function QuickDTCLookup({ baseVehicleId, onResultClick }: QuickDTCLookupProps) {
    const [dtcCode, setDtcCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleLookup = async () => {
        if (!dtcCode.trim() || !baseVehicleId) return

        setIsLoading(true)
        setError(null)
        setResult(null)

        try {
            const response = await fetch(
                `/api/ai/diagnostics/dtc?baseVehicleId=${baseVehicleId}&code=${encodeURIComponent(dtcCode.trim())}`,
                { method: 'GET' }
            )

            if (!response.ok) {
                throw new Error('Failed to lookup DTC')
            }

            const data = await response.json()
            setResult(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to lookup DTC')
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLookup()
        }
    }

    return (
        <div className="space-y-4">
            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={dtcCode}
                    onChange={(e) => setDtcCode(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter DTC code (e.g., P0420)"
                    className="flex-1 px-3 py-2 text-sm border rounded bg-surface-100 text-foreground placeholder-foreground-lighter focus:outline-none focus:ring-2 focus:ring-brand-600"
                    disabled={isLoading || !baseVehicleId}
                />
                <Button
                    onClick={handleLookup}
                    disabled={!dtcCode.trim() || isLoading || !baseVehicleId}
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700"
                >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <Search className="w-4 h-4" />
          )}
                </Button>
            </div>

            {/* No Vehicle Warning */}
      {!baseVehicleId && (
        <div className="text-xs text-warning-600 bg-warning-200 rounded px-3 py-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Select a vehicle to enable DTC lookup</span>
        </div>
      )}

            {/* Error */}
            {error && (
                <div className="text-sm text-destructive-600 bg-destructive-200 rounded px-3 py-2">
                    {error}
                </div>
            )}

            {/* Result */}
            {result && result.success && result.dtc && (
                <div className="border rounded-lg p-3 bg-surface-100">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning-600" />
              {result.dtc.code}
            </h4>
                        {onResultClick && (
                            <button
                                onClick={() => onResultClick(result.dtc.code)}
                                className="text-xs text-brand-600 hover:text-brand-700"
                            >
                                View Details →
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-foreground-light">{result.dtc.description}</p>

                    {result.dtc.system && (
                        <div className="mt-2 text-xs text-foreground-lighter">
                            <span className="font-medium">System:</span> {result.dtc.system}
                        </div>
                    )}

                    {result.dtc.possibleCauses && result.dtc.possibleCauses.length > 0 && (
                        <div className="mt-3">
                            <div className="text-xs font-medium text-foreground-light mb-1">Possible Causes:</div>
                            <ul className="text-xs text-foreground-lighter space-y-1 list-disc list-inside">
                                {result.dtc.possibleCauses.slice(0, 3).map((cause: string, idx: number) => (
                                    <li key={idx}>{cause}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {result && result.success && !result.dtc && (
                <div className="text-sm text-foreground-light text-center py-4">
                    No information found for code {dtcCode}
                </div>
            )}
        </div>
    )
}

