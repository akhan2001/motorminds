'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Plus, Search, FileText, Filter, Download, Send, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { TemplateSelector } from './TemplateSelector'
import { useTemplatePreference } from '../../hooks/use-template-preference'

interface InvoiceHeaderProps {
    className?: string
    onNewInvoice?: () => void
    searchValue?: string
    onSearchChange?: (value: string) => void
    onBulkDownload?: () => void
    onBulkSend?: () => void
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({
    className,
    onNewInvoice,
    searchValue = '',
    onSearchChange,
    onBulkDownload,
    onBulkSend
}) => {
    const router = useRouter()
    const { templateId, setTemplateId } = useTemplatePreference()

    const handleArchivedInvoices = () => {
        router.push('/financials/invoices/archived')
    }

    return (
        <div className={cn("bg-background dark:bg-[#0d0d0d] border-b border-border dark:border-[#2a2a2a] flex-shrink-0", className)}>
            {/* Main Header */}
            <div className="px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Left Section - Title */}
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-2">
                                {/* <FileText className="h-6 w-6" /> */}
                                Invoices
                            </h1>
                            <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                                Create, manage, and track all invoices for your shop
                            </p>
                        </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3">
                        <TemplateSelector
                            selectedTemplateId={templateId}
                            onTemplateChange={setTemplateId}
                            className="gap-2 bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                        />
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleArchivedInvoices}
                            className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            Archived Invoices
                        </Button>
                        
                        {/* TODO: Implement bulk send functionality */}
                        {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={onBulkSend}
                            className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Bulk Send
                        </Button> */}

                        {/* Create Invoice Button */}
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={onNewInvoice}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Invoice
                        </Button>
                    </div>
                </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="px-6 pb-3">
                <div className="flex items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1 max-w-lg">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        <Input
                            placeholder="Search invoices by number, customer, or amount..."
                            value={searchValue}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="pl-10 bg-background dark:bg-[#1a1a1a] border-border dark:border-[#3a3a3a] text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-gray-500 focus:border-red-500"
                        />
                    </div>

                    {/* Filter Button */}
                    {/* <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                    </div> */}
                </div>
            </div>
        </div>
    )
}

export default InvoiceHeader
