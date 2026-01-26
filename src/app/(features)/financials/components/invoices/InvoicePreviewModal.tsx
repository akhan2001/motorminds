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
import { generateInvoicePDF, downloadPDF, getInvoiceFilename } from '../../lib/pdf/pdf-generator'
import { prepareShopBrandingWithLogo } from '../../lib/pdf/logo-utils'
import type { InvoiceWithDetails } from '../../types/invoice'
import type { ShopBranding } from '../../types/invoice-pdf'
import { toast } from 'sonner'

interface InvoicePreviewModalProps {
    invoice: InvoiceWithDetails | null
    shopInfo: ShopBranding | null
    templateId: string
    isOpen: boolean
    onClose: () => void
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
    invoice,
    shopInfo,
    templateId,
    isOpen,
    onClose,
}) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const pdfUrlRef = useRef<string | null>(null)

    // Generate PDF preview when modal opens
    useEffect(() => {
        if (!isOpen || !invoice || !shopInfo) {
            // Clean up object URL when modal closes
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
                // Prepare shop branding with logo
                const shop = await prepareShopBrandingWithLogo(shopInfo)
                
                // Generate PDF blob
                // Note: For 'tony' template, this will use React-PDF version for preview
                // The actual download may use HTML-to-PDF for exact match
                const blob = await generateInvoicePDF(invoice, shop, templateId)
                
                if (!isCancelled) {
                    // Clean up previous URL if exists
                    if (pdfUrlRef.current) {
                        URL.revokeObjectURL(pdfUrlRef.current)
                    }
                    
                    // Create object URL for preview
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
            // Cleanup object URL when modal closes or dependencies change
            if (pdfUrlRef.current) {
                URL.revokeObjectURL(pdfUrlRef.current)
                pdfUrlRef.current = null
                setPdfUrl(null)
            }
        }
    }, [isOpen, invoice?.id, shopInfo?.id, templateId])

    const handleDownload = async () => {
        if (!invoice || !shopInfo || !pdfUrl) return

        setIsDownloading(true)
        try {
            // Prepare shop branding with logo
            const shop = await prepareShopBrandingWithLogo(shopInfo)
            
            // Generate PDF blob for download
            const blob = await generateInvoicePDF(invoice, shop, templateId)
            const filename = getInvoiceFilename(invoice)
            
            // Download the PDF
            downloadPDF(blob, filename)
            toast.success('Invoice PDF downloaded successfully')
        } catch (error) {
            console.error('PDF download error:', error)
            toast.error('Failed to download PDF')
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full h-[90vh] p-0 flex flex-col bg-white dark:bg-[#0d0d0d]">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border dark:border-[#333333]">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Invoice PDF Preview
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
                            title="Invoice PDF Preview"
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
