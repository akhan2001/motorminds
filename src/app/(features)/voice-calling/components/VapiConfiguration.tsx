'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function VapiConfiguration() {
    const [assistantId, setAssistantId] = useState('8f1236c2-aba3-4741-8a12-3227c72de173')
    const [loading, setLoading] = useState(false)
    const [configured, setConfigured] = useState(false)
    const [configurationDetails, setConfigurationDetails] = useState<any>(null)

    const configureAssistant = async () => {
        if (!assistantId.trim()) {
            toast.error('Please enter an assistant ID')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/vapi/configure-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assistantId: assistantId.trim() })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || `HTTP ${response.status}`)
            }

            const result = await response.json()
            setConfigured(true)
            setConfigurationDetails(result.configuration)
            toast.success('Assistant configured successfully!')

        } catch (error: any) {
            console.error('Configuration error:', error)
            toast.error(`Configuration failed: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const checkConfiguration = async () => {
        if (!assistantId.trim()) {
            toast.error('Please enter an assistant ID')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/vapi/configure-assistant?assistantId=${assistantId.trim()}`)
            
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || `HTTP ${response.status}`)
            }

            const result = await response.json()
            setConfigured(result.hasStructuredData)
            setConfigurationDetails(result.currentSchema ? {
                structuredDataEnabled: true,
                requiredFields: result.currentSchema.required || [],
                totalFields: Object.keys(result.currentSchema.properties || {}).length
            } : null)

            if (result.hasStructuredData) {
                toast.success('Assistant is already configured!')
            } else {
                toast.info('Assistant needs configuration')
            }

        } catch (error: any) {
            console.error('Check error:', error)
            toast.error(`Check failed: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-400" />
                    Vapi Assistant Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Assistant ID Input */}
                <div>
                    <Label className="text-white">Assistant ID</Label>
                    <Input
                        value={assistantId}
                        onChange={(e) => setAssistantId(e.target.value)}
                        placeholder="Enter your Vapi assistant ID"
                        className="bg-gray-900 border-gray-700 text-white"
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={configureAssistant}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Settings className="h-4 w-4 mr-2" />
                        )}
                        Configure Structured Data
                    </Button>
                    
                    <Button
                        onClick={checkConfiguration}
                        disabled={loading}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                        Check Status
                    </Button>
                </div>

                {/* Configuration Status */}
                {configurationDetails && (
                    <div className="bg-gray-900 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            {configured ? (
                                <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-400" />
                            )}
                            <span className="text-white font-medium">
                                {configured ? 'Configuration Active' : 'Configuration Needed'}
                            </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Structured Data:</span>
                                <Badge className={configurationDetails.structuredDataEnabled ? 'bg-green-600' : 'bg-red-600'}>
                                    {configurationDetails.structuredDataEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                            </div>
                            
                            {configurationDetails.structuredDataEnabled && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Total Fields:</span>
                                        <span className="text-white">{configurationDetails.totalFields}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Required Fields:</span>
                                        <span className="text-white">{configurationDetails.requiredFields?.length || 0}</span>
                                    </div>
                                    
                                    {configurationDetails.requiredFields && (
                                        <div>
                                            <p className="text-gray-400 mb-2">Required Fields:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {configurationDetails.requiredFields.map((field: string, i: number) => (
                                                    <Badge key={i} variant="outline" className="border-blue-500 text-blue-400 text-xs">
                                                        {field}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Schema Preview */}
                <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Structured Data Schema</h4>
                    <p className="text-gray-400 text-sm mb-3">
                        This configuration will extract the following automotive parts data:
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        {[
                            'partNumber', 'partName', 'price', 'retailPrice', 'quantity',
                            'availability', 'eta', 'deliveryDays', 'supplierPartNumber',
                            'brand', 'condition', 'warranty', 'supplierName', 'contactPerson'
                        ].map((field, i) => (
                            <Badge key={i} variant="outline" className="border-gray-600 text-gray-300">
                                {field}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-blue-400 font-medium mb-2">Setup Instructions:</h4>
                    <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
                        <li>Enter your Vapi assistant ID above</li>
                        <li>Click "Configure Structured Data" to enable extraction</li>
                        <li>Test with a call to see structured data in action</li>
                        <li>View extracted data in the VapiAnalysis component</li>
                    </ol>
                </div>
            </CardContent>
        </Card>
    )
}
