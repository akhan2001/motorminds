'use client'

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PageLoading } from "@/components/common/feedback/page-states";
import { useAuth } from "../../operations/hooks/use-auth";
import { useInvoices } from "../hooks/use-invoices";
import InvoiceHeader from "../components/invoices/InvoiceHeader";
import InvoiceList from "../components/invoices/InvoiceList";
import InvoiceDashboard from "../components/invoices/InvoiceDashboard";
import NewInvoice from "../components/invoices/NewInvoice";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function InvoicesContent() {
    // Navigation
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Auth state
    const { shopId, isLoading: isAuthLoading } = useAuth()
    
    // Invoice loading state
    const { isLoading: isInvoicesLoading } = useInvoices(shopId || '')
    
    // State
    const [searchValue, setSearchValue] = useState('')
    // Initialize selected invoice from URL query parameter
    const invoiceNumberFromUrl = searchParams.get('invoice_number')
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(invoiceNumberFromUrl)
    const [showNewInvoiceDialog, setShowNewInvoiceDialog] = useState(false)
    
    // Update selected invoice when URL parameter changes
    useEffect(() => {
        const invoiceNumber = searchParams.get('invoice_number')
        if (invoiceNumber) {
            setSelectedInvoice(invoiceNumber)
        }
    }, [searchParams])
    
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

    // Show loading spinner while auth is loading or invoices are loading
    if (isAuthLoading || (shopId && isInvoicesLoading)) {
        return (
            <PageLoading 
                title="Loading Invoices" 
                description={isAuthLoading ? 'Authenticating...' : 'Loading invoice data...'} 
                spinnerColor="text-red-500"
            />
        )
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="flex-1 flex flex-col overflow-hidden">
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
                            <div className="h-full">
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
    return <PageLoading title="Loading Invoices" description="Please wait..." spinnerColor="text-red-500" />
}

// Main component with Suspense wrapper
export default function InvoicesPage() {
    return (
        <Suspense fallback={<InvoicesLoading />}>
            <InvoicesContent />
        </Suspense>
    )
}
