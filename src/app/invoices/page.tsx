"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { InvoiceFilter } from "./components/invoice-filter"
import { InvoiceCard } from "./components/invoice-card"
import { fetchAllInvoices, formatCurrency, formatDate } from "./utils/invoice-utils"
import { Nav } from "../components/nav"
import { InfoHoverCard } from "../components/InfoHoverCard"

<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { InvoiceFilter } from './components/invoice-filter';
import { InvoiceCard } from './components/invoice-card';
import { fetchAllInvoices, formatCurrency, formatDate } from './utils/invoice-utils';
import { Nav } from '../components/nav';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInvoices = async () => {
            setIsLoading(true);
            try {
                const data = await fetchAllInvoices();
                if (data) {
                    setInvoices(data);
                }
            } catch (error) {
                console.error("Error loading invoices:", error);
            } finally {
                setIsLoading(false);
            }
        };
=======
export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])

  // The filter: "all" | "paid" | "unpaid"
  const [selectedFilter, setSelectedFilter] = useState<"all" | "paid" | "unpaid">("all")
>>>>>>> ali

  useEffect(() => {
    checkUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      await loadInvoices(user.id)
    } else {
      router.push("/login")
    }
  }

  async function loadInvoices(userId: string) {
    // get user's shop_id
    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("shop_id")
      .eq("id", userId)
      .single()

    if (userErr || !userData?.shop_id) {
      console.error("No valid shop_id found or error:", userErr)
      router.push("/login")
      return
    }

    // fetch only that shop's invoices
    const data = await fetchAllInvoices(userData.shop_id)
    if (data) {
      setInvoices(data)
    }
  }

  // Filter the displayed invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedFilter === "all")   return true
    if (selectedFilter === "paid")   return inv.status === "PAID"
    if (selectedFilter === "unpaid") return inv.status === "UNPAID"
    return true
  })

  // Basic "today" & "month" counts for the 3 boxes
  const todayCount = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.issue_date)
    const today = new Date()
    return invoiceDate.toDateString() === today.toDateString()
  }).length

  const monthCount = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.issue_date)
    const today = new Date()
    return (
<<<<<<< HEAD
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Invoices" />

            <div className="flex items-center justify-center py-8">
                <div className="container mx-auto max-w-[1300px]">
                    <div className="flex flex-row justify-between items-center mb-8">
                        <div className="flex flex-col">
                            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-white">Invoices</h1>
                            <p className="text-gray-400">
                                Manage your invoices and track their activity. Add new invoices, edit their information, and view their activity.
                            </p>
                        </div>
                        <div className="flex flex-row gap-4">
                            <Button className="bg-[#B22222] hover:bg-[#B22222]/80 text-white rounded-full px-7">
                                <PlusIcon className="w-4 h-4 mr-1" />
                                ADD NEW INVOICE
                            </Button>
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="flex flex-row gap-4 justify-start mb-8">
                        <InvoiceFilter title="ALL" todayCount={todayCount} monthCount={monthCount} active={true} />
                        <InvoiceFilter title="PAID" todayCount={todayCount} monthCount={monthCount} />
                        <InvoiceFilter title="UNPAID" todayCount={todayCount} monthCount={monthCount} />
                    </div>

                    {/* INVOICES */}
                    <div className="flex flex-col gap-4 bg-[#000]">
                        {isLoading ? (
                            // Show loading skeletons
                            Array(3).fill(0).map((_, i) => (
                                <div key={`skeleton-${i}`} className="w-full p-6 rounded-lg border border-[#131313] animate-pulse">
                                    <div className="h-6 bg-[#131313] rounded w-1/4 mb-4"></div>
                                    <div className="h-4 bg-[#131313] rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-[#131313] rounded w-3/4 mb-2"></div>
                                    <div className="flex justify-between mt-4">
                                        <div className="h-5 bg-[#131313] rounded w-1/5"></div>
                                        <div className="h-5 bg-[#131313] rounded w-1/5"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            invoices.map((invoice, index) => (
                                <InvoiceCard
                                    key={`invoice-${invoice.id || index}`}
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
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
=======
      invoiceDate.getMonth() === today.getMonth() &&
      invoiceDate.getFullYear() === today.getFullYear()
    )
  }).length

  return (
    <div className="min-h-screen bg-black">
      <Nav activeLink="Invoices" />

      <div className="flex items-center justify-center py-8">
        <div className="container mx-auto max-w-[1300px]">
          <h1 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
            Invoices
            <InfoHoverCard text="More Invoice features are coming soon. If you have any questions, please contact support." />
          </h1>

          {/* The 3 Filter Boxes */}
          <div className="flex flex-row gap-4 justify-start mb-8">
            <InvoiceFilter
              title="All"
              todayCount={todayCount}
              monthCount={monthCount}
              active={selectedFilter === "all"}
              onClick={() => setSelectedFilter("all")}
            />
            <InvoiceFilter
              title="Paid"
              todayCount={todayCount}
              monthCount={monthCount}
              active={selectedFilter === "paid"}
              onClick={() => setSelectedFilter("paid")}
            />
            <InvoiceFilter
              title="Unpaid"
              todayCount={todayCount}
              monthCount={monthCount}
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
              />
            ))}
          </div>
>>>>>>> ali
        </div>
      </div>
    </div>
  )
}
