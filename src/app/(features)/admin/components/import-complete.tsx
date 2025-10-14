"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { ImportResult } from '../types/migrations'

interface ImportCompleteComponentProps {
    importResult: ImportResult
    onReset: () => void
}

export default function ImportCompleteComponent({
    importResult,
    onReset
}: ImportCompleteComponentProps) {
    return (
        <Card className="bg-[#111111] border-[#2a2a2a]">
            <CardHeader>
                <CardTitle className="text-white flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                    Import Complete
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Successfully Imported!
                        </h3>
                        <p className="text-gray-400">
                            {importResult.imported_count} invoices have been imported to the staging table
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                            <p className="text-3xl font-bold text-green-400">{importResult.imported_count}</p>
                            <p className="text-sm text-gray-400">Imported</p>
                        </div>
                        <div className="text-center p-4 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg">
                            <p className="text-3xl font-bold text-red-400">{importResult.failed_count}</p>
                            <p className="text-sm text-gray-400">Failed</p>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                        <p className="text-blue-300 text-sm">
                            <strong>Batch ID:</strong> {importResult.batch_id}
                        </p>
                        <p className="text-blue-300 text-sm mt-2">
                            Invoices are now in the staging table and ready for review before final migration to production.
                        </p>
                    </div>

                    <div className="flex justify-center space-x-4 pt-4 border-t border-[#2a2a2a]">
                        <Button
                            onClick={onReset}
                            variant="outline"
                            className="border-gray-600 text-gray-300"
                        >
                            Import Another File
                        </Button>
                        <Button
                            asChild
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Link href="/admin/migrations">
                                View Staging Tables
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
