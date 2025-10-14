"use client"

import React, { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, RefreshCw } from 'lucide-react'

interface FileUploadComponentProps {
    selectedFile: File | null
    analyzing: boolean
    onFileSelect: (file: File) => void
}

export default function FileUploadComponent({
    selectedFile,
    analyzing,
    onFileSelect
}: FileUploadComponentProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            onFileSelect(file)
        }
    }

    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Invoice CSV File
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {selectedFile ? (
                        <div className="space-y-4">
                            <FileText className="h-16 w-16 text-blue-400 mx-auto" />
                            <div>
                                <p className="text-white font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-gray-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                            {analyzing && (
                                <div className="flex items-center justify-center space-x-2 text-blue-400">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>Analyzing with AI...</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                            <div>
                                <p className="text-white font-medium mb-2">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-400">CSV files only</p>
                            </div>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </CardContent>
        </Card>
    )
}
