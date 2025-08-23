"use client"

import { Bot, Zap, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMiaSidebar } from '@/contexts/MiaSidebarContext'

export function MiaSidebar() {
    const { isOpen, closeSidebar, currentPage } = useMiaSidebar()

    // Only render if we're on a supported page
    if (!currentPage) return null

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeSidebar()
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent 
                side="right" 
                className="w-[320px] sm:w-[400px] bg-[#0d0d0d] border-l border-[#1f1f1f] p-0 flex flex-col"
            >
                <SheetHeader className="p-4 border-b border-[#1f1f1f]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#b22222] rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <SheetTitle className="text-white font-semibold">
                                Mia AI Assistant
                            </SheetTitle>
                            <p className="text-xs text-[#979797]">
                                {currentPage === 'invoices' ? 'Invoice Workspace' : 'AI Workspace'}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {currentPage === 'invoices' && <InvoiceWorkspace />}
                    {/* Add other page workspaces here */}
                </div>
            </SheetContent>
        </Sheet>
    )
}

function InvoiceWorkspace() {
    return (
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
            {/* Context Panel */}
            <div className="bg-[#1f1f1f] rounded-lg p-4 border border-[#2f2f2f]">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-[#b22222]" />
                    <span className="text-sm font-medium text-white">Quick Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#0d0d0d] border-[#2f2f2f] text-[#979797] hover:text-white hover:bg-[#1f1f1f]"
                    >
                        Create Invoice
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#0d0d0d] border-[#2f2f2f] text-[#979797] hover:text-white hover:bg-[#1f1f1f]"
                    >
                        Send Reminder
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#0d0d0d] border-[#2f2f2f] text-[#979797] hover:text-white hover:bg-[#1f1f1f]"
                    >
                        Generate Report
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#0d0d0d] border-[#2f2f2f] text-[#979797] hover:text-white hover:bg-[#1f1f1f]"
                    >
                        Add Customer
                    </Button>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 bg-[#1f1f1f] rounded-lg border border-[#2f2f2f] flex flex-col min-h-0">
                <div className="flex items-center gap-2 p-3 border-b border-[#2f2f2f]">
                    <MessageCircle className="w-4 h-4 text-[#b22222]" />
                    <span className="text-sm font-medium text-white">Chat with Mia</span>
                </div>
                
                {/* Chat Messages Area */}
                <div className="flex-1 p-3 overflow-y-auto min-h-0">
                    <div className="space-y-3">
                        <div className="bg-[#0d0d0d] rounded-lg p-3 border border-[#2f2f2f]">
                            <p className="text-sm text-white">
                                Hi! I'm ready to help with your invoices. What would you like to do?
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-[#2f2f2f]">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ask me anything about invoices..."
                            className="flex-1 bg-[#0d0d0d] border border-[#2f2f2f] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#979797] focus:outline-none focus:border-[#b22222]"
                        />
                        <Button 
                            size="sm"
                            className="bg-[#b22222] hover:bg-[#e23232] text-white"
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
