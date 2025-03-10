"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import InvoiceForm from "./components/invoice-forms"
import { InvoiceFilter } from "./components/invoice-filter"
import { InvoiceCard } from "./components/invoice-card"
import { fetchAllInvoices, formatCurrency, formatDate } from "./utils/invoice-utils"
import { Nav } from "../components/nav"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId } from "@/utils/supabase/supabase-shop"
import LoadingPage from "@/components/loading"

export default function InvoicesPage() {
    const router = useRouter()
    const [invoices, setInvoices] = useState<any[]>([])
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [shopId, setShopId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshInvoices = async () => {
        if (shopId) {
            const invoices = await fetchAllInvoices(shopId)
            setInvoices(invoices)
        }
    }

    const handleOpenForm = () => {
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
    };
    

    // The filter: "all" | "paid" | "unpaid"
    const [selectedFilter, setSelectedFilter] = useState<"all" | "paid" | "unpaid">("all")

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                const user = await checkUser()
                if (user) {
                    setUser(user)
                    console.log(user.id)
                    const shopId = await getShopId(user.id)
                    if (shopId) {
                        setShopId(shopId)
                        const invoices = await fetchAllInvoices(shopId)
                        setInvoices(invoices)
                    } else {
                        console.error("No shop ID found")
                        router.push("/login");
                    }
                } else {
                    console.error("No user found")
                    router.push("/login");
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Authentication error:", error);
                router.push("/login");
            }
        }
        loadData()
    }, [])

    if (isLoading) {
        return <LoadingPage page="Invoices" />
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

    return (
        <div className="min-h-screen bg-black text-white">
            <Nav activeLink="Invoices" />
            <div className="flex items-center justify-center py-8">
                <div className="container mx-auto max-w-[1300px]">
                    <div className="flex flex-row justify-between items-center mb-10">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Invoices</h1>
                            <p className="text-gray-400">
                                Keep track of all your invoices in one place. Create, manage, and download PDF invoices effortlessly.
                            </p>
                        </div>
                        <div className="flex flex-row gap-4">
                            <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-7" onClick={handleOpenForm}>
                                <PlusIcon className="w-4 h-4 mr-1" />
                                ADD INVOICE
                            </Button>
                        </div>
                    </div>

                {/* The 3 Filter Boxes */}
                <div className="flex flex-row gap-4 justify-start mb-8">
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

                <div className="flex flex-col gap-4">
                    {filteredInvoices.map((invoice, index) => (
                        <InvoiceCard
                            key={index}
                            invoiceNumber={invoice.invoice_number}
                            clientName={invoice.client_name}
                            clientAddress={invoice.client_address}
                            clientEmail={invoice.client_email}
                            amount={formatCurrency(invoice.amount)}
                            issueDate={formatDate(invoice.issue_date)}
                            status={invoice.status}
                            shopName={invoice.shop_name}
                            shopAddress={invoice.shop_address}
                            shopEmail={invoice.shop_email}
                            labour={invoice.labour}
                            parts={invoice.parts}
                            notes={invoice.notes}
                            mileage={invoice.mileage}
                            description={invoice.description}
                            assignedTo={invoice.assigned_to}
                        />
                    ))}
                </div>
                </div>
            </div>
            <InvoiceForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                shopId={shopId || ""}
                onInvoiceCreated={refreshInvoices}
            />
        </div>
    )
}