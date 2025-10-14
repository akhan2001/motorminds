"use client"

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, CheckCircle, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react'
import { CSVAnalysis, ColumnMapping } from '../types/migrations'

interface ColumnMappingComponentProps {
    csvAnalysis: CSVAnalysis
    columnMappings: Record<string, string>
    updateMapping: (stagingField: string, csvColumn: string) => void
    onBack: () => void
    onNext: () => void
    previewing?: boolean
}

export default function ColumnMappingComponent({
    csvAnalysis,
    columnMappings,
    updateMapping,
    onBack,
    onNext,
    previewing = false
}: ColumnMappingComponentProps) {
    // Auto-apply AI suggestions on mount
    useEffect(() => {
        csvAnalysis.suggested_mappings.forEach((mapping) => {
            // Only auto-apply if not already set, AI has a suggestion, and confidence is decent
            if (!columnMappings[mapping.staging_field] && mapping.csv_column && mapping.confidence > 0.3) {
                updateMapping(mapping.staging_field, mapping.csv_column)
            }
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [csvAnalysis]) // Run when csvAnalysis changes

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center">
                        <Sparkles className="h-5 w-5 mr-2" />
                        AI-Powered Column Mapping
                    </div>
                    <Badge className={`text-white ${
                        csvAnalysis.confidence_score > 0.8 
                            ? 'bg-green-600' 
                            : csvAnalysis.confidence_score > 0.5 
                                ? 'bg-yellow-600' 
                                : 'bg-red-600'
                    }`}>
                        {Math.round(csvAnalysis.confidence_score * 100)}% Confidence
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                        <p className="text-blue-300 text-sm">
                            Map each staging invoice field to a CSV column. AI suggestions are shown with confidence scores.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {csvAnalysis.suggested_mappings.map((mapping, index) => {
                            const selectedColumn = columnMappings[mapping.staging_field] || ''
                            const displayValue = selectedColumn || '_none_'
                            
                            return (
                                <div key={`${mapping.staging_field}-${index}`} className="p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <Label className="text-white font-semibold min-w-[180px]">
                                                    {mapping.staging_field.split('_').map(word => 
                                                        word.charAt(0).toUpperCase() + word.slice(1)
                                                    ).join(' ')}:
                                                </Label>
                                                {mapping.required && (
                                                    <Badge className="bg-red-600/20 text-red-400 border border-red-600/30">
                                                        Required
                                                    </Badge>
                                                )}
                                                {selectedColumn && selectedColumn !== '_skip_' && selectedColumn !== '_none_' && mapping.suggested && (
                                                    <Badge className="bg-green-600/20 text-green-400 border border-green-600/30">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        AI Match {Math.round(mapping.confidence * 100)}%
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="w-64">
                                            <Select 
                                                value={displayValue}
                                                onValueChange={(value) => {
                                                    const newValue = value === '_none_' ? '' : value
                                                    updateMapping(mapping.staging_field, newValue)
                                                }}
                                            >
                                                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                                                    <SelectValue placeholder="Select CSV column..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="_none_">— No column —</SelectItem>
                                                    <SelectItem value="_skip_">⚠ Skip Field</SelectItem>
                                                    {csvAnalysis.headers.filter(h => h && h.trim()).map((header) => (
                                                        <SelectItem key={header} value={header}>
                                                            {header}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-[#2a2a2a]">
                        <Button
                            type="button"
                            onClick={onBack}
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                            disabled={previewing}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Configuration
                        </Button>
                        <Button
                            type="button"
                            onClick={onNext}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={previewing}
                        >
                            {previewing ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating Preview...
                                </>
                            ) : (
                                <>
                                    Generate Preview
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
