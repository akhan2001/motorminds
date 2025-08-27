import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bell, Plus, X, Send, Loader2 } from "lucide-react"
import { useMiaSidebar } from "@/contexts/MiaSidebarContext"
import { useState } from "react"

interface MiaSidebarTopProps {
    currentPage?: string
    onSendMessage?: (message: string) => void
    isLoading?: boolean
}

export default function MiaSidebarTop({ 
    currentPage = 'invoices', 
    onSendMessage, 
    isLoading = false 
}: MiaSidebarTopProps) {
    const { closeSidebar } = useMiaSidebar()
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Handle quick action clicks
    const handleQuickAction = async (action: string, message: string) => {
        if (!onSendMessage || isLoading) return
        
        setActionLoading(action)
        try {
            onSendMessage(message)
        } finally {
            // Reset loading state after a brief delay to show feedback
            setTimeout(() => setActionLoading(null), 1000)
        }
    }

    // Generate context-aware messages based on current page
    const getActionMessage = (action: string, page: string) => {
        switch (action) {
            case 'send-invoice':
                if (page === 'invoices') {
                    return "Send the latest invoice to the customer"
                }
                return "Send an invoice to a customer"
            case 'create-invoice':
                return "Create a new invoice"
            case 'send-reminder':
                return "Send a payment reminder to a customer"
            default:
                return `Help me with ${action}`
        }
    }
    
    return (
        <div className="border-b border-[#2a2a2a] bg-black/50">
            {/* Page Context Indicator */}
            <div className="px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {/* <Image  
                        src="/red-motorminds-logo-svg.svg"
                        alt="Mia AI"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                    /> */}
                    <span className="text-sm font-medium text-white">
                        Current Page: 
                        <span className="ml-2 px-2 py-1 bg-[#b22222]/30 text-[#b22222] text-sm rounded-full capitalize border border-[#b22222]/30">
                            {currentPage}
                        </span>
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]/50 rounded-md" 
                    onClick={closeSidebar}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
            <Separator className="bg-[#2a2a2a]" />
            {/* Quick Actions - Context Aware */}
            <div className="space-y-2 px-4 py-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Quick Actions
                </h4>
                <div className="grid gap-1">
                    {currentPage === 'invoices' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left h-8 px-3 text-gray-300 hover:bg-[#b22222]/20 hover:text-[#b22222] border border-transparent hover:border-[#b22222]/30"
                                onClick={() => handleQuickAction('create-invoice', getActionMessage('create-invoice', currentPage))}
                                disabled={isLoading || actionLoading === 'create-invoice'}
                            >
                                {actionLoading === 'create-invoice' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Create Invoice
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left h-8 px-3 text-gray-300 hover:bg-[#b22222]/20 hover:text-[#b22222] border border-transparent hover:border-[#b22222]/30"
                                onClick={() => handleQuickAction('send-reminder', getActionMessage('send-reminder', currentPage))}
                                disabled={isLoading || actionLoading === 'send-reminder'}
                            >
                                {actionLoading === 'send-reminder' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Bell className="w-4 h-4 mr-2" />
                                )}
                                Send Reminder
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left h-8 px-3 text-gray-300 hover:bg-[#b22222]/20 hover:text-[#b22222] border border-transparent hover:border-[#b22222]/30"
                                onClick={() => handleQuickAction('send-invoice', getActionMessage('send-invoice', currentPage))}
                                disabled={isLoading || actionLoading === 'send-invoice'}
                            >
                                {actionLoading === 'send-invoice' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                )}
                                Send Invoice
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
