"use client"

import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import InvoiceForm from "./invoice-forms"
import EditInvoiceForm from "./EditInvoiceForm"
import { InvoiceFilter } from "./invoice-filter"
import { InvoiceCard } from "./invoice-card"
import { InvoiceDialog } from "./InvoiceDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchAllInvoices, formatCurrency, formatDate, fetchShopBusinessDetails } from "../utils/invoice-utils"
import { PlusIcon, ArrowUpDown, Calendar as CalendarIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoadingPage from "@/components/loading"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ReadonlyURLSearchParams } from "next/navigation"

export default function InvoiceDashboard({ shopId, searchParams }: { shopId: string, searchParams: ReadonlyURLSearchParams | null }) {
    const [invoices, setInvoices] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isEditFormOpen, setIsEditFormOpen] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [isDateFilterActive, setIsDateFilterActive] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const router = useRouter();
    
    // The filter: "all" | "paid" | "unpaid"
    const [selectedFilter, setSelectedFilter] = useState<"all" | "paid" | "unpaid">("all")
    // Active tab for source filtering
    const [activeSourceTab, setActiveSourceTab] = useState<"all" | "shop_generated" | "customer_generated">("all")

    // Handle opening invoice from URL
    useEffect(() => {
        const invoiceId = searchParams?.get('invoiceId')
        if (invoiceId && invoices.length > 0) {
            const invoiceToOpen = invoices.find(inv => inv.invoice_number === invoiceId);
            if (invoiceToOpen) {
                handleOpenInvoice(invoiceToOpen);
            }
        }
    }, [searchParams, invoices]);
    
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

    const handleEditInvoice = (invoice: any) => {
        setSelectedInvoice(invoice);
        setIsDialogOpen(false);
        setIsEditFormOpen(true);
    }

    const handleOpenForm = () => {
        setSelectedInvoice(null); // Ensure we're in create mode
        setIsFormOpen(true)
    }

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setIsEditFormOpen(false);
        // Clear selected invoice if we were in edit mode
        if (selectedInvoice && !isDialogOpen) {
            setSelectedInvoice(null);
        }
    }

    const handleOpenInvoice = async (invoice: any) => {
        const formattedInvoice = await mapInvoiceToDialogFormat(invoice);
        setSelectedInvoice(formattedInvoice);
        setIsDialogOpen(true);
    }

    const handleCloseInvoice = () => {
        setIsDialogOpen(false);
        setSelectedInvoice(null);
        // Refresh invoices when dialog closes to get any updates
        refreshInvoices();
        router.push('/invoices', { scroll: false });
    }

    // Filter the displayed invoices
    const filteredInvoices = invoices.filter((inv) => {
        // Status filter
        let statusMatch = true;
        if (selectedFilter === "paid") statusMatch = inv.status === "PAID"
        else if (selectedFilter === "unpaid") statusMatch = inv.status === "UNPAID"
        
        // Source filter
        let sourceMatch = true;
        if (activeSourceTab === "shop_generated") sourceMatch = inv.source === "shop_generated"
        else if (activeSourceTab === "customer_generated") sourceMatch = inv.source === "customer_generated"
        
        return statusMatch && sourceMatch;
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

    // Customer-generated invoices counts
    const customerTodayCount = invoices.filter(invoice => 
        invoice.source === "customer_generated" && isToday(invoice.issue_date)
    ).length
    const customerMonthCount = invoices.filter(invoice => 
        invoice.source === "customer_generated" && isThisMonth(invoice.issue_date)
    ).length

    // Shop-generated invoices counts
    const shopTodayCount = invoices.filter(invoice => 
        invoice.source === "shop_generated" && isToday(invoice.issue_date)
    ).length
    const shopMonthCount = invoices.filter(invoice => 
        invoice.source === "shop_generated" && isThisMonth(invoice.issue_date)
    ).length

    // Filter and sort the invoices more efficiently using useMemo
    const sortedInvoices = useMemo(() => {
        return [...filteredInvoices]
            .filter(invoice => {
                // Date filter
                if (isDateFilterActive && selectedDate) {
                    const dateMatches = format(new Date(invoice.issue_date), "yyyy-MM-dd") === 
                                       format(selectedDate, "yyyy-MM-dd");
                    if (!dateMatches) return false;
                }
                
                // Search query filter
                if (searchQuery.trim() !== "") {
                    const query = searchQuery.toLowerCase();
                    const invoiceNumberMatch = invoice.invoice_number?.toLowerCase().includes(query) || 
                                              invoice.display_id?.toLowerCase().includes(query);
                    const clientNameMatch = invoice.client_name?.toLowerCase().includes(query);
                    const descriptionMatch = invoice.description?.toLowerCase().includes(query);
                    
                    return invoiceNumberMatch || clientNameMatch || descriptionMatch;
                }
                
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.issue_date).getTime()
                const dateB = new Date(b.issue_date).getTime()
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
            })
    }, [filteredInvoices, isDateFilterActive, selectedDate, sortOrder, searchQuery])


    // Map invoice data to the format expected by InvoiceDialog
    const mapInvoiceToDialogFormat = async (invoice: any) => {
        // Construct the logo URL using the shop_id
        let shopLogoUrl = null;
        if (invoice.shop_id) {
            // We'll let the PDF generator try both formats
            shopLogoUrl = `https://zjkdltcpjzyzisbgznyj.supabase.co/storage/v1/object/public/motorminds/shop_logos/${invoice.shop_id}/${invoice.shop_id}_logo`;
        }
        
        // Get the business details from the shop record if not already in the invoice
        let businessDetails = { 
            hst_number: invoice.hst_number || '',
            business_number: invoice.business_number || ''
        };
        
        if (invoice.shop_id && (!invoice.hst_number && !invoice.business_number)) {
            try {
                businessDetails = await fetchShopBusinessDetails(invoice.shop_id);
            } catch (error) {
                console.error("Error fetching shop business details:", error);
            }
        }
        
        return {
            invoiceNumber: invoice.invoice_number,
            invoice_number: invoice.invoice_number,
            displayNumber: invoice.display_id,
            workOrder: invoice.workorder_id,
            status: invoice.status,
            shopName: invoice.shop_name,
            shopAddress: invoice.shop_address,
            shopEmail: invoice.shop_email,
            shopPhone: invoice.shop_phone,
            shopLogo: shopLogoUrl,
            amount: invoice.amount,
            issueDate: invoice.issue_date,
            clientName: invoice.client_name,
            clientAddress: invoice.client_address,
            clientEmail: invoice.client_email,
            clientPhone: invoice.client_phone,
            labour: invoice.labour,
            labour_total_price: invoice.labour_total_price,
            parts: invoice.parts,
            parts_total_price: invoice.parts_total_price,
            notes: invoice.notes,
            mileage: invoice.mileage,
            description: invoice.description,
            assignedTo: invoice.assigned_to,
            hst_number: businessDetails.hst_number,
            business_number: businessDetails.business_number,
            labour_items: invoice.labour_items || [],
            parts_items: invoice.parts_items || [],
            source: invoice.source,
            customer_notes: invoice.customer_notes,
            estimated_amount: invoice.estimated_amount,
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
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 sm:px-7 py-1.5 text-xs sm:text-sm" onClick={handleOpenForm}>
                            <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            ADD INVOICE
                        </Button>
                    </div>
                </div>

                {/* Search input for invoice number, client name, and description */}
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                        type="text"
                        placeholder="Search by invoice number, client name, or title..."
                        className="pl-10 bg-[#131313] border border-[#222] text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Status Filter Boxes */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-start mb-4">
                    <div className="w-full sm:w-auto">
                        <h4 className="text-sm text-gray-400 mb-2">Filter by Status</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:min-w-[600px]">
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
                    </div>
                </div>

                {/* Source Tabs */}
                <Tabs value={activeSourceTab} onValueChange={(value) => setActiveSourceTab(value as any)} className="mb-6 sm:mb-8">
                    <TabsList className="bg-[#131313] border border-[#333] h-12">
                        <TabsTrigger 
                            value="all" 
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2"
                        >
                            All Invoices ({allMonthCount})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="shop_generated" 
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2"
                        >
                            Shop Generated ({shopMonthCount})
                        </TabsTrigger>
                        <TabsTrigger 
                            value="customer_generated" 
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white px-4 py-2"
                        >
                            Customer Requests ({customerMonthCount})
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                
                <div className="flex flex-wrap gap-2 mb-6 justify-end">
                    <div className="flex flex-wrap gap-2">
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
                            onClick={() => setIsDateFilterActive(true)}
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
                                source={invoice.source}
                                estimatedAmount={invoice.estimated_amount}
                                customerNotes={invoice.customer_notes}
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
                                    {searchQuery ? ` matching "${searchQuery}"` : ""}
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

            {/* Invoice edit form */}
            {selectedInvoice && (
                <EditInvoiceForm
                    isOpen={isEditFormOpen}
                    onClose={handleCloseForm}
                    shopId={shopId}
                    onInvoiceUpdated={refreshInvoices}
                    existingInvoice={selectedInvoice}
                />
            )}

            {/* Invoice detail dialog */}
            {selectedInvoice && !isEditFormOpen && (
                <InvoiceDialog
                    isOpen={isDialogOpen}
                    onClose={handleCloseInvoice}
                    invoice={selectedInvoice}
                    shopId={shopId}
                    onInvoiceUpdated={refreshInvoices}
                    // onEdit={() => handleEditInvoice(selectedInvoice)}
                />
            )}
        </div>
    )
}