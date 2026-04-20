'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { generateWorkOrderPDF, getWorkOrderFilename } from '../../../lib/work-order-pdf-generator'
import { prepareShopBrandingWithLogo } from '../../../../financials/lib/pdf/logo-utils'
import { getWorkOrderDocumentLabel } from '../pdf/WorkOrderPDFTemplate'
import type { WorkOrderWithDetails } from '../../../types/work-order'
import type { WorkOrderItem } from '../../../types/work-order-items'
import type { ShopBranding } from '../../../../financials/types/invoice-pdf'
import { toast } from 'sonner'

interface WorkOrderPreviewModalProps {
    workOrder: WorkOrderWithDetails | null
    workOrderItems: WorkOrderItem[]
    shopInfo: ShopBranding | null
    isOpen: boolean
    onClose: () => void
}

export const WorkOrderPreviewModal: React.FC<WorkOrderPreviewModalProps> = ({
    workOrder,
    workOrderItems,
    shopInfo,
    isOpen,
    onClose,
}) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const pdfUrlRef = useRef<string | null>(null)

    useEffect(() => {
        if (!isOpen || !workOrder || !shopInfo) {
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current)
                pdfUrlRef.current = null
                setPdfUrl(null)
            }
            return
        }

        let isCancelled = false

        const generatePreview = async () => {
            setIsGenerating(true)
            try {
                const shop = await prepareShopBrandingWithLogo(shopInfo)
                const blob = await generateWorkOrderPDF(workOrder, workOrderItems, shop)

                if (!isCancelled) {
                    if (pdfUrlRef.current) {
                        URL.revokeObjectURL(pdfUrlRef.current)
                    }
                    const url = URL.createObjectURL(blob)
                    pdfUrlRef.current = url
                    setPdfUrl(url)
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error('PDF preview generation error:', error)
                    toast.error('Failed to generate PDF preview')
                }
            } finally {
                if (!isCancelled) {
                    setIsGenerating(false)
                }
            }
        }

        generatePreview()

        return () => {
            isCancelled = true
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current)
                pdfUrlRef.current = null
                setPdfUrl(null)
            }
        }
    }, [isOpen, workOrder?.id, shopInfo?.id])

    const handleDownload = async () => {
        if (!workOrder || !shopInfo || !pdfUrl) return

        setIsDownloading(true)
        try {
            const shop = await prepareShopBrandingWithLogo(shopInfo)
            const blob = await generateWorkOrderPDF(workOrder, workOrderItems, shop)
            const filename = getWorkOrderFilename(workOrder)

            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            link.click()
            URL.revokeObjectURL(url)

            toast.success('PDF downloaded successfully')
        } catch (error) {
            console.error('PDF download error:', error)
            toast.error('Failed to download PDF')
        } finally {
            setIsDownloading(false)
        }
    }

    const documentLabel = workOrder ? getWorkOrderDocumentLabel(workOrder.status) : 'Work Order'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col bg-white dark:bg-[#0d0d0d]">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border dark:border-[#333333]">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {documentLabel} PDF Preview
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative bg-muted/50">
                    {isGenerating ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background">
                            <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full border-0 bg-white"
                            title={`${documentLabel} PDF Preview`}
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-background">
                            <p className="text-sm text-muted-foreground">No preview available</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="px-6 py-4 border-t border-border bg-background">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleDownload}
                        disabled={isDownloading || !pdfUrl}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isDownloading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Downloading...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
