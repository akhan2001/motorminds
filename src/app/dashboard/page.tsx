"use client"

import { useEffect, useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { fetchAllInvoices } from "@/app/invoices/utils/invoice-utils"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

import { ChatMessageBubble } from "@/app/chat/components/ChatMessageBubble"
import { IntermediateStep } from "@/app/chat/components/IntermediateStep"
import CustomChatStart from "@/app/chat/components/CustomChatStart"
import ChatFooter from "@/app/chat/components/ChatFooter"
// import { Nav } from "../components/nav"

import { format } from "date-fns"


interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}
interface Invoice {
  id: string
  client_name: string
  client_address: string
  client_email: string
  amount: number
  issue_date: string
}
interface Shop {
  id: string
  shop_owner?: string
  shop_name?: string
  shop_address?: string
  shop_email?: string
}

export default function DashboardPage() {
  const router = useRouter()

  const [date, setDate] = useState<Date>(new Date())
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [shop, setShop] = useState<Shop | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkSessionAndLoadData()
  }, [])

  async function checkSessionAndLoadData() {
    // Check user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // get shop_id from "users"
    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("shop_id")
      .eq("id", user.id)
      .single()

    if (userErr || !userData?.shop_id) {
      console.error("No valid shop_id or error:", userErr)
      router.push("/login")
      return
    }

    const shopId = userData.shop_id

    // fetch the shop record
    const { data: shopData, error: shopErr } = await supabase
      .from("shops")
      .select("*")
      .eq("id", shopId)
      .single()
    if (shopErr) {
      console.error("Error fetching shop:", shopErr)
    } else {
      setShop(shopData)
    }

    // fetch invoices
    const invoiceData = await fetchAllInvoices(shopId)
    if (invoiceData) {
      setInvoices(invoiceData)
    }
  }

  /* ------------------ Chat Submission ------------------ */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const userText = input.trim()
    if (!userText) return
  
    // Make the updated array
    const newUserMsg: ChatMessage = { role: "user", content: userText }
    const updatedMessages = [...messages, newUserMsg]
  
    // Now set state
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)
  
    try {
      // Pass updatedMessages to the server
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })
  
      if (!res.ok) {
        const errorBody = await res.text()
        throw new Error(`Chat request failed. Status: ${res.status}, Body: ${errorBody}`)
      }
  
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error("No readable stream on response.")
      }
      let finalText = ""
      const decoder = new TextDecoder("utf-8")
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        finalText += decoder.decode(value)
      }
  
      const assistantMsg: ChatMessage = { role: "assistant", content: finalText }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error("Error sending chat:", err)
    } finally {
      setIsLoading(false)
    }
  }
  

  const hasMessages = messages.length > 0

  return (
    <>
      {/* Remove default focus outlines */}
      <style jsx global>{`
        :focus {
          outline: none !important;
          box-shadow: none !important;
        }
        button:focus,
        [role="button"]:focus,
        input:focus,
        select:focus,
        textarea:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <div className="min-h-screen flex flex-col bg-black text-white">
        <main className="container mx-auto px-4 py-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold">
              <span className="w-2 h-8 bg-red-600 rounded" />
              Welcome {shop?.shop_owner}
            </h1>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard title="Leads" todayCount={20} monthCount={250} />
            <StatCard title="Customers" todayCount={20} monthCount={250} />
            <StatCard
              title="Tasks"
              todayLabel="To-Do"
              todayCount={15}
              monthLabel="Completed"
              monthCount={4}
            />
          </div>

          {/* 3 columns => Invoices, Calendar, Chat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-start">
            {/* Column 1 => Invoices */}
            <div className="flex flex-col h-[550px] min-h-0">
              <h2 className="text-2xl font-bold mb-2">Upcoming Invoices</h2>
              <div className="flex-1 min-h-0">
                <ScrollArea className="w-full h-full">
                  <div className="space-y-4 pr-2">
                    {/* Show first 5 invoices => "Invoice #1, #2" */}
                    {invoices.slice(0, 5).map((inv, idx) => (
                      <InvoiceBlock
                        key={inv.id || idx}
                        invoiceIndex={idx + 1}
                        invoice={inv}
                        shop={shop}
                      />
                    ))}

                    {invoices.length === 0 && (
                      <p className="text-gray-400">No invoices found.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Column 2 => Calendar */}
            <div className="flex flex-col h-[550px] min-h-0">
              <h2 className="text-2xl font-bold mb-2">Calendar</h2>
              <div className="flex-1 min-h-0 flex justify-center items-start">
                <Calendar
                  mode="single"
                  selected={date}
                  className="max-w-[450px]"
                />
              </div>
            </div>

            {/* Column 3 => Chat */}
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold mb-2">MIA AI</h2>
              {/*
                Removed h-[550px] here, so the chat is "pushed up".
                We'll handle no-messages vs. messages differently
                to ensure a vertical gap above the "Ask me anything" input.
              */}
              {!hasMessages ? (
                // If no messages => show "How Can I Assist You?" + the input form with a margin
                <div className="flex flex-col items-center">
                  <CustomChatStart />
                  <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[600px] px-2">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-2 rounded-md bg-[#222222] text-white"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-red-600 text-white px-4"
                      >
                        {isLoading ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </form>
                  <ChatFooter />
                </div>
              ) : (
                // If there are messages => pinned input at bottom
                <div className="flex-1 min-h-0 flex flex-col bg-transparent">
                  <ScrollArea className="flex-1 overflow-y-auto mb-4 pr-2">
                    <div className="space-y-4">
                      {messages.map((msg, midx) => {
                        let isIntermediate = false
                        try {
                          const parsed = JSON.parse(msg.content)
                          if (parsed.action && parsed.observation) {
                            isIntermediate = true
                          }
                        } catch {}
                        return isIntermediate ? (
                          <IntermediateStep key={midx} message={msg as any} />
                        ) : (
                          <ChatMessageBubble
                            key={midx}
                            message={msg as any}
                            sources={[]}
                          />
                        )
                      })}
                    </div>
                  </ScrollArea>

                  <form onSubmit={handleSubmit} className="mt-auto mb-4">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-2 rounded-md bg-[#222222] text-white"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-red-600 text-white px-4"
                      >
                        {isLoading ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </form>
                  <ChatFooter />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

/* ------------------ HELPER COMPONENTS ------------------ */

function StatCard({
  title,
  todayLabel = "Today",
  todayCount,
  monthLabel = "This Month",
  monthCount,
}: {
  title: string
  todayLabel?: string
  todayCount: number
  monthLabel?: string
  monthCount: number
}) {
  return (
    <div className="bg-[#131313] border border-[#1f1f1f] rounded-md shadow-sm p-4">
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <div className="space-y-1 text-sm">
        <div className="text-gray-400">
          {todayLabel}: <span className="text-white font-medium">{todayCount}</span>
        </div>
        <div className="text-gray-400">
          {monthLabel}: <span className="text-white font-medium">{monthCount}</span>
        </div>
      </div>
    </div>
  )
}

function InvoiceBlock({
  invoiceIndex,
  invoice,
  shop,
}: {
  invoiceIndex: number
  invoice: {
    id: string
    client_name: string
    client_address: string
    client_email: string
    amount: number
    issue_date: string
  }
  shop: {
    shop_owner?: string
    shop_name?: string
    shop_address?: string
    shop_email?: string
  } | null
}) {
  const formattedDate = format(new Date(invoice.issue_date), "MMM d, yyyy")

  const shopOwner = shop?.shop_owner ?? "Owner Name"
  const shopName = shop?.shop_name ?? "Shop Name"
  const shopAddr = shop?.shop_address ?? "Address"
  const shopEmail = shop?.shop_email ?? "email@example.com"

  return (
    <div className="bg-[#131313] border border-[#1f1f1f] rounded-md shadow-sm p-4 transform transition-transform hover:scale-105">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-xl font-bold text-white">Invoice #{invoiceIndex}</h4>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{shopOwner}</p>
          <p className="text-xs text-gray-400">{shopName}</p>
          <p className="text-xs text-gray-400">{shopAddr}</p>
          <p className="text-xs text-gray-400">{shopEmail}</p>
        </div>
      </div>

      <div className="border-t border-[#1f1f1f] pt-3 flex justify-between">
        <div>
          <p className="text-xs text-gray-400">BILL TO</p>
          <p className="font-medium text-white">{invoice.client_name}</p>
          <p className="text-xs text-gray-400">{invoice.client_address}</p>
          <p className="text-xs text-gray-400">{invoice.client_email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">AMOUNT DUE</p>
          <p className="text-green-400 font-bold">${invoice.amount}</p>
          <p className="text-xs text-gray-400">Issued on: {formattedDate}</p>
        </div>
      </div>
    </div>
  )
}
