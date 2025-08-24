"use client"

import { Bot, Zap, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useMiaSidebar } from '@/contexts/MiaSidebarContext'

export function MiaSidebar() {
    const { isOpen, closeSidebar, currentPage } = useMiaSidebar()

    // Only render if we're on a supported page and not invoices (invoices uses an inline panel)
    if (!currentPage || currentPage === 'invoices') return null

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            closeSidebar()
        }
    }

    return (
        <div className="w-[320px] sm:w-[400px] bg-[#0d0d0d] border-l border-[#1f1f1f] p-0 flex flex-col h-full">
            <div className="p-4 border-b border-[#1f1f1f]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#b22222] rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <h2 className="text-white font-semibold">
                            Mia AI Assistant
                        </h2>
                        <p className="text-xs text-[#979797]">
                            AI Workspace
                        </p>
                    </div>
                </div>
            </div>

            {/* Content placeholder */}
            <div className="flex-1 flex items-center justify-center text-[#979797]">
                Chat / Actions go here
            </div>
        </div>
    )
}
