import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
    Database, 
    Calendar, 
    Users, 
    Car, 
    Settings, 
    FileText, 
    Bell, 
    TrendingUp, 
    Plus,
    FolderOpen,
    Wrench
} from "lucide-react"
import Image from "next/image"

interface MiaSidebarTopProps {
    currentPage?: string
}

export default function MiaSidebarTop({ currentPage = 'invoices' }: MiaSidebarTopProps) {
    return (
        <div className="border-b border-[#2a2a2a] bg-black/50">
            {/* Page Context Indicator */}
            <div className="px-4 py-3">
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
                        <span className="ml-2 px-2 py-1 bg-[#b22222]/30 text-[#b22222] text-sm rounded-full capitalize">
                            {currentPage}
                        </span>
                    </span>
                </div>
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
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Invoice
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left h-8 px-3 text-gray-300 hover:bg-[#b22222]/20 hover:text-[#b22222]"
                            >
                                <Bell className="w-4 h-4 mr-2" />
                                Send Reminder
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left h-8 px-3 text-gray-300 hover:bg-[#b22222]/20 hover:text-[#b22222]"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Generate Report
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="justify-start text-left h-8 px-3 text-gray-300 hover:bg-[#b22222]/20 hover:text-[#b22222]"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Add Customer
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
