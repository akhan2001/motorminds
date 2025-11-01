'use client'

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Loader2, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "@/components/common/feedback/loading-states";
import InvoiceHeader from "../components/invoices/InvoiceHeader";
import InvoiceList from "../components/invoices/InvoiceList";
import InvoiceDashboard from "../components/invoices/InvoiceDashboard";
import NewInvoice from "../components/invoices/NewInvoice";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function InvoicesContent() {
    // Navigation
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // State
    const [searchValue, setSearchValue] = useState('')
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
    const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
    
    // Handlers
    const handleNewInvoice = () => {
        setShowNewInvoiceDialog(true)
    }
    
    const handleInvoiceClick = (invoiceId: string) => {
        setSelectedInvoice(invoiceId)
    }
    
    const handleCloseForm = () => {
        setSelectedInvoice(null)
    }
    
    const handleBulkDownload = () => {
        // TODO: Implement bulk download
        console.log('Bulk download clicked')
    }
    
    const handleBulkSend = () => {
        // TODO: Implement bulk send
        console.log('Bulk send clicked')
    }
    
    const handleNewInvoiceCreated = () => {
        // Refresh the invoice list or handle the created invoice
        setShowNewInvoiceDialog(false)
        // You might want to refresh the list here
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden px-4">
                <InvoiceHeader 
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    onNewInvoice={handleNewInvoice}
                    onBulkDownload={handleBulkDownload}
                    onBulkSend={handleBulkSend}
                />

                {/* Main Content - Resizable Layout */}
                <div className="flex-1 overflow-hidden">
                    <ResizablePanelGroup direction="horizontal" className="h-full">
                        {/* Left Panel - Invoice List - 50% */}
                        <ResizablePanel defaultSize={50} minSize={40} maxSize={60}>
                            <div className="h-full p-2">
                                <InvoiceList 
                                    searchValue={searchValue}
                                    onInvoiceClick={handleInvoiceClick}
                                    selectedInvoiceId={selectedInvoice}
                                />
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Right Panel - Invoice Form/Details - 50% */}
                        <ResizablePanel defaultSize={50} minSize={40} maxSize={60}>
                            <div className="h-full p-2">
                                <InvoiceDashboard 
                                    selectedInvoiceId={selectedInvoice}
                                    onClose={handleCloseForm}
                                />
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </div>
            
            {/* New Invoice Dialog */}
            <NewInvoice 
                isOpen={showNewInvoiceDialog}
                onClose={() => setShowNewInvoiceDialog(false)}
                onInvoiceCreated={handleNewInvoiceCreated}
            />
        </div>
    )
}

// Loading component for Suspense fallback
function InvoicesLoading() {
    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex items-center justify-center">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardContent className="flex items-center gap-4 p-6">
                        <LoadingSpinner size="md" className="text-red-500" />
                        <div>
                            <p className="text-white font-medium">Loading Invoices</p>
                            <p className="text-gray-400 text-sm">Please wait...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Main component with Suspense wrapper
export default function InvoicesPage() {
    return (
        <Suspense fallback={<InvoicesLoading />}>
            <InvoicesContent />
        </Suspense>
    )
}
