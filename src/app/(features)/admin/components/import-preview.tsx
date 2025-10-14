"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    FileText, 
    CheckCircle, 
    AlertTriangle, 
    RefreshCw, 
    ArrowLeft, 
    XCircle 
} from 'lucide-react'
import { MigrationPreview } from '../types/migrations'

interface ImportPreviewComponentProps {
    preview: MigrationPreview
    importing: boolean
    onBack: () => void
    onApprove: () => void
    onCancel: () => void
}

export default function ImportPreviewComponent({
    preview,
    importing,
    onBack,
    onApprove,
    onCancel
}: ImportPreviewComponentProps) {
    return (
        <div className="space-y-6">
            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Import Preview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                            <p className="text-3xl font-bold text-blue-400">{preview.total_records}</p>
                            <p className="text-sm text-gray-400">Total Records</p>
                        </div>
                        <div className="text-center p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                            <p className="text-3xl font-bold text-green-400">{preview.valid_records}</p>
                            <p className="text-sm text-gray-400">Valid</p>
                        </div>
                        <div className="text-center p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                            <p className="text-3xl font-bold text-red-400">{preview.invalid_records}</p>
                            <p className="text-sm text-gray-400">Invalid</p>
                        </div>
                    </div>

                    <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm">
                                <thead className="bg-[#0d0d0d] sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-gray-300">#</th>
                                        <th className="px-4 py-3 text-left text-gray-300">Invoice Number</th>
                                        <th className="px-4 py-3 text-left text-gray-300">Date</th>
                                        <th className="px-4 py-3 text-left text-gray-300">Total</th>
                                        <th className="px-4 py-3 text-left text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.preview_rows.map((row, index) => (
                                        <tr 
                                            key={index} 
                                            className={`border-t border-[#2a2a2a] ${
                                                preview.validation_errors[index] ? 'bg-red-900/20' : 'hover:bg-[#0d0d0d]/50'
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-gray-300">{index + 1}</td>
                                            <td className="px-4 py-3 text-gray-300">
                                                {row.invoice_number || 'N/A'}
                                                {preview.validation_errors[index] && (
                                                    <AlertTriangle className="h-4 w-4 text-red-400 inline ml-2" />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                {row.invoice_date ? new Date(row.invoice_date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                ${row.total_amount?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={
                                                    preview.validation_errors[index] 
                                                        ? 'border-red-600 text-red-400' 
                                                        : 'border-green-600 text-green-400'
                                                }>
                                                    {preview.validation_errors[index] ? 'Invalid' : 'Valid'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {preview.invalid_records > 0 && (
                        <div className="mt-4 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                                <div>
                                    <h4 className="text-yellow-400 font-medium">Validation Warnings</h4>
                                    <p className="text-sm text-yellow-300 mt-1">
                                        {preview.invalid_records} records have validation errors. Review them before importing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-[#111111] border-[#2a2a2a]">
                <CardHeader>
                    <CardTitle className="text-white flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Confirm Import
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                            <p className="text-blue-300">
                                You are about to import <strong>{preview.total_records}</strong> invoice records 
                                into the staging table. This action can be reviewed before final migration to production.
                            </p>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-[#2a2a2a]">
                            <Button
                                type="button"
                                onClick={onBack}
                                variant="outline"
                                className="border-gray-600 text-gray-300"
                                disabled={importing}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Mapping
                            </Button>
                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    onClick={onCancel}
                                    variant="outline"
                                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                                    disabled={importing}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Import
                                </Button>
                                <Button
                                    onClick={onApprove}
                                    disabled={importing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {importing ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve & Import
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
