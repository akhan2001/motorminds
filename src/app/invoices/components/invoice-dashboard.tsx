"use client"

import { useEffect, useState, useMemo } from "react"
import InvoiceForm from "./invoice-forms"
import { InvoiceFilter } from "./invoice-filter"
import { InvoiceCard } from "./invoice-card"
import { InvoiceDialog } from "./InvoiceDialog"
import { fetchAllInvoices, formatCurrency, formatDate } from "../utils/invoice-utils"
import { PlusIcon, ArrowUpDown, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoadingPage from "@/components/loading"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function InvoiceDashboard({ shopId }: { shopId: string }) {
    const [invoices, setInvoices] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isDateFilterActive, setIsDateFilterActive] = useState(true)
    
    // The filter: "all" | "paid" | "unpaid"
    const [selectedFilter, setSelectedFilter] = useState<"all" | "paid" | "unpaid">("all")
    
    // Only load invoices when shopId is provided (and on initial mount)
    useEffect(() => {
        async function loadInvoices() {
            if (!shopId) return;
            
            setIsLoading(true)
            try {
                const invoicesData = await fetchAllInvoices(shopId)
                setInvoices(invoicesData)
            } catch (error) {
                console.error("Error fetching invoices:", error)
            } finally {
                setIsLoading(false)
            }
        }
        
        loadInvoices()
    }, [shopId])

    const refreshInvoices = async () => {
        if (!shopId) return;
        
        setIsLoading(true)
        try {
            const invoicesData = await fetchAllInvoices(shopId)
            setInvoices(invoicesData)
        } catch (error) {
            console.error("Error refreshing invoices:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenForm = () => {
        setIsFormOpen(true)
    }

    const handleCloseForm = () => {
        setIsFormOpen(false)
    }

    const handleOpenInvoice = (invoice: any) => {
        setSelectedInvoice(invoice)
        setIsDialogOpen(true)
    }

    const handleCloseInvoice = () => {
        setIsDialogOpen(false)
        // Refresh invoices when dialog closes to get any updates
        refreshInvoices()
    }

    // Filter the displayed invoices
    const filteredInvoices = invoices.filter((inv) => {
        if (selectedFilter === "all")   return true
        if (selectedFilter === "paid")   return inv.status === "PAID"
        if (selectedFilter === "unpaid") return inv.status === "UNPAID"
        return true
    })

    // Calculate counts for each filter type
    const isToday = (date: string) => {
        const invoiceDate = new Date(date)
        const today = new Date()
        return invoiceDate.toDateString() === today.toDateString()
    }

    const isThisMonth = (date: string) => {
        const invoiceDate = new Date(date)
        const today = new Date()
        return (
            invoiceDate.getMonth() === today.getMonth() &&
            invoiceDate.getFullYear() === today.getFullYear()
        )
    }

    // All invoices counts
    const allTodayCount = invoices.filter(invoice => isToday(invoice.issue_date)).length
    const allMonthCount = invoices.filter(invoice => isThisMonth(invoice.issue_date)).length

    // Paid invoices counts
    const paidTodayCount = invoices.filter(invoice => 
        invoice.status === "PAID" && isToday(invoice.issue_date)
    ).length
    const paidMonthCount = invoices.filter(invoice => 
        invoice.status === "PAID" && isThisMonth(invoice.issue_date)
    ).length

    // Unpaid invoices counts
    const unpaidTodayCount = invoices.filter(invoice => 
        invoice.status === "UNPAID" && isToday(invoice.issue_date)
    ).length
    const unpaidMonthCount = invoices.filter(invoice => 
        invoice.status === "UNPAID" && isThisMonth(invoice.issue_date)
    ).length

    // Filter and sort the invoices more efficiently using useMemo
    const sortedInvoices = useMemo(() => {
        return [...filteredInvoices]
            .filter(invoice => {
                if (!isDateFilterActive) return true // Show all if date filter is inactive
                if (!selectedDate) return true
                return format(new Date(invoice.issue_date), "yyyy-MM-dd") === 
                       format(selectedDate, "yyyy-MM-dd")
            })
            .sort((a, b) => {
                const dateA = new Date(a.issue_date).getTime()
                const dateB = new Date(b.issue_date).getTime()
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
            })
    }, [filteredInvoices, isDateFilterActive, selectedDate, sortOrder])


    // Map invoice data to the format expected by InvoiceDialog
    const mapInvoiceToDialogFormat = (invoice: any) => {
        return {
            invoiceNumber: invoice.invoice_number,
            displayNumber: invoice.display_id,
            workOrder: invoice.workorder_id,
            status: invoice.status,
            shopName: invoice.shop_name,
            shopAddress: invoice.shop_address,
            shopEmail: invoice.shop_email,
            shopPhone: invoice.shop_phone,
            amount: invoice.amount,
            issueDate: invoice.issue_date,
            clientName: invoice.client_name,
            clientAddress: invoice.client_address,
            clientEmail: invoice.client_email,
            clientPhone: invoice.client_phone,
            labour: invoice.labour,
            labour_cost: invoice.labour_cost,
            parts: invoice.parts,
            parts_cost: invoice.parts_cost,
            notes: invoice.notes,
            mileage: invoice.mileage,
            description: invoice.description,
            assignedTo: invoice.assigned_to,
            vehicleInfo: invoice.vehicle_information ? {
                year: invoice.vehicle_information.year,
                make: invoice.vehicle_information.make,
                model: invoice.vehicle_information.model,
                license_plate: invoice.vehicle_information.license_plate
            } : {
                year: "",
                make: "",
                model: "",
                license_plate: ""
            }
        }
    }

    return (
        <div className="flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">Invoices</h1>
                        <p className="text-gray-400 text-sm sm:text-base">
                            Keep track of all your invoices in one place. Create, manage, and download PDF invoices effortlessly.
                        </p>
                    </div>
                    <div className="flex flex-row gap-4 w-full sm:w-auto justify-end">
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-4 sm:px-7 py-1.5 text-xs sm:text-sm" onClick={handleOpenForm}>
                            <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            ADD INVOICE
                        </Button>
                    </div>
                </div>

                {/* The 3 Filter Boxes */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-start mb-6 sm:mb-8">
                    <div className="grid grid-cols-3 gap-2 w-full min-w-[50%] sm:w-auto">
                        <InvoiceFilter
                            title="All"
                            todayCount={allTodayCount}
                            monthCount={allMonthCount}
                            active={selectedFilter === "all"}
                            onClick={() => setSelectedFilter("all")}
                        />
                        <InvoiceFilter
                            title="Paid"
                            todayCount={paidTodayCount}
                            monthCount={paidMonthCount}
                            active={selectedFilter === "paid"}
                            onClick={() => setSelectedFilter("paid")}
                        />
                        <InvoiceFilter
                            title="Unpaid"
                            todayCount={unpaidTodayCount}
                            monthCount={unpaidMonthCount}
                            active={selectedFilter === "unpaid"}
                            onClick={() => setSelectedFilter("unpaid")}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 sm:mt-0 sm:ml-auto">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`bg-[#131313] border text-xs sm:text-sm ${isDateFilterActive ? "border-red-500" : "border-[#222]"} hover:border-gray-500`}
                                    disabled={!isDateFilterActive}
                                >
                                    <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden xs:inline">
                                        {isDateFilterActive && selectedDate ? format(selectedDate, "PPP") : "Select Date"}
                                    </span>
                                    <span className="xs:hidden">Date</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="text-white w-[280px] sm:w-[350px] p-0 bg-[#131313] border border-[#222]">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(day) => {
                                        setSelectedDate(day || new Date());
                                        setIsDateFilterActive(true);
                                    }}
                                    initialFocus
                                    className="bg-[#131313]"
                                />
                            </PopoverContent>
                        </Popover>
                        <Button
                            className={`bg-[#131313] border text-xs sm:text-sm ${isDateFilterActive ? "border-[#222]" : "border-red-500"} hover:border-gray-500`}
                            onClick={() => setIsDateFilterActive(false)}
                        >
                            View All
                        </Button>
                        <Button
                            className="bg-[#131313] border border-[#222] hover:border-gray-500 text-xs sm:text-sm"
                            onClick={() => {
                                setSelectedDate(new Date());
                                setIsDateFilterActive(true);
                            }}
                        >
                            Today
                        </Button>
                        <Button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="bg-[#131313] border border-[#222] hover:border-gray-500 text-xs sm:text-sm"
                        >
                            <span className="hidden xs:inline">Date {sortOrder === 'asc' ? '↑' : '↓'}</span>
                            <span className="xs:hidden">Sort</span>
                            <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                    {sortedInvoices.length > 0 ? (
                        sortedInvoices.map((invoice, index) => (
                            <InvoiceCard
                                key={index}
                                invoiceNumber={invoice.invoice_number}
                                displayNumber={invoice.display_id}
                                status={invoice.status}
                                amount={formatCurrency(invoice.amount)}
                                issueDate={formatDate(invoice.issue_date)}
                                shopName={invoice.shop_name}
                                shopAddress={invoice.shop_address}
                                clientName={invoice.client_name}
                                clientAddress={invoice.client_address}
                                clientEmail={invoice.client_email}
                                description={invoice.description}
                                vehicleInfo={invoice.vehicle_information ? {
                                    year: invoice.vehicle_information.year,
                                    make: invoice.vehicle_information.make,
                                    model: invoice.vehicle_information.model,
                                    license_plate: invoice.vehicle_information.license_plate
                                } : undefined}
                                workOrder={invoice.workorder_id}
                                onClick={() => handleOpenInvoice(invoice)}
                                onStatusChange={refreshInvoices}
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-[#131313] border border-[#222] rounded-lg">
                            <div className="text-center space-y-2 sm:space-y-3">
                                <p className="text-gray-400 text-lg sm:text-xl">
                                    No {selectedFilter === "all" ? "" : selectedFilter === "paid" ? "paid" : "unpaid"} invoices 
                                    {isDateFilterActive ? ` for ${format(selectedDate, "MMMM d, yyyy")}` : ""}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice creation form */}
            <InvoiceForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                shopId={shopId}
                onInvoiceCreated={refreshInvoices}
            />

            {/* Invoice detail dialog */}
            {selectedInvoice && (
                <InvoiceDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseInvoice}
                    invoice={mapInvoiceToDialogFormat(selectedInvoice)}
                    shopId={shopId}
                />
            )}
        </div>
    )
}