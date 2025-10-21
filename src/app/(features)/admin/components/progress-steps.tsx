"use client"

import React from 'react'
import { Upload, Database, Sparkles, FileText, CheckCircle } from 'lucide-react'

interface ProgressStepsProps {
    currentStep: string
}

const steps = [
    { key: 'upload', label: 'Upload CSV', icon: Upload },
    { key: 'configure', label: 'Configure', icon: Database },
    { key: 'mapping', label: 'Column Mapping', icon: Sparkles },
    { key: 'preview', label: 'Preview', icon: FileText },
    { key: 'complete', label: 'Complete', icon: CheckCircle }
]

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, index, array) => {
                    const Icon = step.icon
                    const isActive = currentStep === step.key
                    const isComplete = array.findIndex(s => s.key === currentStep) > index
                    
                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            <div className={`flex items-center space-x-2 ${
                                isActive ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-gray-600'
                            }`}>
                                <div className={`rounded-full p-2 ${
                                    isActive ? 'bg-blue-600' : isComplete ? 'bg-green-600' : 'bg-gray-700'
                                }`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium hidden md:block">{step.label}</span>
                            </div>
                            {index < array.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 ${
                                    isComplete ? 'bg-green-600' : 'bg-gray-700'
                                }`} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
