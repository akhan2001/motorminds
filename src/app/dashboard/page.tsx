"use client"

import { useEffect, useState, useRef, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

import { fetchAllInvoices } from "@/app/invoices/utils/invoice-utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

import { TaskDetailsModal, DetailedRepairOrder } from "@/components/task-details-modal"

import { ChatMessageBubble } from "@/app/chat/components/ChatMessageBubble"
import { IntermediateStep } from "@/app/chat/components/IntermediateStep"
import CustomChatStart from "@/app/chat/components/CustomChatStart"
import ChatFooter from "@/app/chat/components/ChatFooter"
import { Nav } from "../components/nav"

import {
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
} from "date-fns"

/* ------------------ Additional Types ------------------ */
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

/** A minimal "calendar task" shape for date highlighting & listing */
interface CalendarTask {
  id: string
  created_at: string
  status: string
  title: string // from the first detail's description
}

/**
 * Utility: return a text color class for each status
 * or a small colored dot, whichever you prefer.
 */
function getStatusColorClass(status: string): string {
  switch (status) {
    case "Pending":
      return "text-red-500"
    case "In Progress":
      return "text-yellow-400"
    case "Completed":
      return "text-green-500"
    default:
      return "text-gray-400"
  }
}

export default function DashboardPage() {
  const router = useRouter()

  // -------------- Track if we're still loading initial data --------------
  const [initialLoading, setInitialLoading] = useState(true)

  // -------------- Dashboard State --------------
  const [shop, setShop] = useState<Shop | null>(null)
  const [date, setDate] = useState<Date>(new Date())
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // -------------- For tasks in the calendar --------------
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([])
  const [selectedCalTasks, setSelectedCalTasks] = useState<CalendarTask[]>([])

  // -------------- For the detailed modal --------------
  const [selectedTask, setSelectedTask] = useState<DetailedRepairOrder | null>(null)

  const tasksRef = useRef<HTMLDivElement>(null)

  // -------------------- Store shopId so we can re-fetch stats anytime --------------------
  const [myShopId, setMyShopId] = useState<string | null>(null)

  // -------------------- StatCard States --------------------
  // Leads -> created today, created this month
  const [leadsToday, setLeadsToday] = useState(0)
  const [leadsMonth, setLeadsMonth] = useState(0)

  // Customers -> created today, created this month
  const [customersToday, setCustomersToday] = useState(0)
  const [customersMonth, setCustomersMonth] = useState(0)

  // Tasks -> "To-Do" is "Pending"; "Completed" is "Completed"
  const [tasksToDo, setTasksToDo] = useState(0)
  const [tasksCompleted, setTasksCompleted] = useState(0)

  useEffect(() => {
    checkSessionAndLoadData().finally(() => {
      // Once checkSessionAndLoadData finishes,
      // we hide the black loading screen.
      setInitialLoading(false)
    })
  }, [])

  /**
   * Step 1: Check user session, fetch shop, invoices,
   * plus a minimal array of tasks for the calendar,
   * then fetch stats (leads/customers/tasks).
   */
  async function checkSessionAndLoadData() {
    try {
      // Check user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }

      // get shop_id
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
      setMyShopId(shopId)

      // fetch shop
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

      // fetch tasks: minimal columns for the calendar
      const { data: rawRows, error: tasksErr } = await supabase
        .from("repair_orders")
        .select(`
          id,
          created_at,
          status,
          repair_order_details(
            description
          )
        `)
        .eq("shop_id", shopId)

      if (tasksErr) {
        console.error("Error fetching tasks for calendar:", tasksErr)
        return
      }
      if (rawRows) {
        const mapped = rawRows.map((row: any) => {
          const detail = row.repair_order_details?.[0]
          return {
            id: row.id,
            created_at: row.created_at,
            status: row.status || "Pending",
            title: detail?.description || "Untitled",
          }
        }) as CalendarTask[]
        setCalendarTasks(mapped)

        // Filter today's tasks for the default date
        const filtered = filterCalTasksByDate(mapped, new Date())
        setSelectedCalTasks(filtered)
      }

      // -------------------- Fetch stat counts for leads, customers, tasks --------------------
      await fetchStats(shopId)
    } catch (err) {
      console.error("Error in checkSessionAndLoadData:", err)
      // In a real app, handle or show an error message
    }
  }

  /**
   * fetchStats(shopId):
   *   1) Leads: today, this month
   *   2) Customers: today, this month
   *   3) Tasks: "Pending" vs "Completed"
   */
  async function fetchStats(shopId: string) {
    // We'll use date-fns to define ranges for "today" and "this month"
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())

    // 1) LEADS -> today
    const { count: leadsTodayCount } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("shop_id", shopId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())

    // 1a) LEADS -> this month
    const { count: leadsMonthCount } = await supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("shop_id", shopId)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString())

    // 2) CUSTOMERS -> today
    const { count: custTodayCount } = await supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("shop_id", shopId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString())

    // 2a) CUSTOMERS -> this month
    const { count: custMonthCount } = await supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("shop_id", shopId)
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString())

    // 3) TASKS -> "Pending" vs "Completed"
    const { data: tasksAll } = await supabase
      .from("repair_orders")
      .select("status")
      .eq("shop_id", shopId)

    if (tasksAll) {
      // "To-Do" is tasks with status === "Pending"
      const toDoCount = tasksAll.filter((t) => t.status === "Pending").length
      // "Completed" is tasks with status === "Completed"
      const completedCount = tasksAll.filter((t) => t.status === "Completed").length

      setTasksToDo(toDoCount)
      setTasksCompleted(completedCount)
    }

    // Finally, store leads & customers counts (use 0 if undefined)
    setLeadsToday(leadsTodayCount ?? 0)
    setLeadsMonth(leadsMonthCount ?? 0)
    setCustomersToday(custTodayCount ?? 0)
    setCustomersMonth(custMonthCount ?? 0)
  }

  function filterCalTasksByDate(all: CalendarTask[], selectedDate: Date) {
    return all.filter((t) => {
      const d = new Date(t.created_at)
      return isSameDay(d, selectedDate)
    })
  }

  function handleDateSelect(selectedDate: Date | undefined) {
    if (!selectedDate) return
    setDate(selectedDate)

    const filtered = filterCalTasksByDate(calendarTasks, selectedDate)
    setSelectedCalTasks(filtered)

    // Always scroll to tasksRef
    setTimeout(() => {
      tasksRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  /**
   * Step 2: handleCalendarTaskClick => fetch the FULL record
   */
  async function handleCalendarTaskClick(minimal: CalendarTask) {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("repair_orders")
        .select(`
          *,
          repair_order_details(*),
          customers(
            *,
            customer_vehicles(*)
          )
        `)
        .eq("id", minimal.id)
        .single()

      if (error) {
        console.error("Error fetching single record:", error)
        return
      }
      if (data) {
        setSelectedTask(data)
      }
    } catch (err) {
      console.error("Unexpected error in handleCalendarTaskClick:", err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Step 3: handleSaveTask => update logic in Supabase,
   * then re-fetch stats to refresh "customers" or "tasks" counts if changed.
   */
  async function handleSaveTask(updated: DetailedRepairOrder) {
    try {
      // 1) update status in "repair_orders"
      const { error: mainErr } = await supabase
        .from("repair_orders")
        .update({ status: updated.status })
        .eq("id", updated.id)
      if (mainErr) throw mainErr

      // 2) update first detail
      const detail = updated.repair_order_details?.[0]
      if (detail?.id) {
        const { error: detailErr } = await supabase
          .from("repair_order_details")
          .update({
            labour: detail.labour,
            parts: detail.parts,
            notes: detail.notes,
            cost: detail.cost,
            mileage: detail.mileage,
            description: detail.description,
          })
          .eq("id", detail.id)
        if (detailErr) throw detailErr
      }

      // 3) update "customers" if changed
      if (updated.customers?.id) {
        const { error: custErr } = await supabase
          .from("customers")
          .update({ customer_name: updated.customers.customer_name })
          .eq("id", updated.customers.id)
        if (custErr) throw custErr
      }

      // 4) update first vehicle if changed
      const firstVehicle = updated.customers?.customer_vehicles?.[0]
      if (firstVehicle?.id) {
        const { error: vehicleErr } = await supabase
          .from("customer_vehicles")
          .update({
            year: firstVehicle.year,
            make: firstVehicle.make,
            model: firstVehicle.model,
            engine_type: firstVehicle.engine_type,
            vin: firstVehicle.vin,
          })
          .eq("id", firstVehicle.id)
        if (vehicleErr) throw vehicleErr
      }

      // Re-fetch minimal tasks array if you want to see updated statuses in the calendar
      setSelectedTask(null)

      const { data: rawRows, error: refreshErr } = await supabase
        .from("repair_orders")
        .select(`
          id,
          created_at,
          status,
          repair_order_details(
            description
          )
        `)
        .eq("shop_id", myShopId)
      if (!refreshErr && rawRows) {
        const mapped = rawRows.map((row: any) => {
          const detail = row.repair_order_details?.[0]
          return {
            id: row.id,
            created_at: row.created_at,
            status: row.status || "Pending",
            title: detail?.description || "Untitled",
          }
        }) as CalendarTask[]
        setCalendarTasks(mapped)
        // Filter for currently selected date
        const filtered = filterCalTasksByDate(mapped, date)
        setSelectedCalTasks(filtered)
      }

      // -------------------- Re-fetch Stats for leads/customers/tasks --------------------
      if (myShopId) {
        await fetchStats(myShopId)
      }
    } catch (err) {
      console.error("handleSaveTask error:", err)
    }
  }

  function handleCloseModal() {
    setSelectedTask(null)
  }

  /* ------------------ Chat Submission ------------------ */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const userText = input.trim()
    if (!userText) return

    const newUserMsg: ChatMessage = { role: "user", content: userText }
    const updatedMessages = [...messages, newUserMsg]

    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    try {
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
      if (!reader) throw new Error("No readable stream on response.")

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

  // ============================
  //  FULL BLACK SCREEN
  //  IF initialLoading === true
  // ============================
  if (initialLoading) {
    // Return a 100vw/100vh black screen (no text).
    return <div className="w-screen h-screen bg-black" />
  }

  return (
    <>
      {/* Hide default focus outlines */}
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
        <Nav activeLink="Dashboard" />
        <main className="container mx-auto px-4 py-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="mb-6">
            <h1 className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold">
              <span className="w-2 h-8 bg-red-600 rounded" />
              Welcome, {shop?.shop_owner}
            </h1>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard title="Leads" todayCount={leadsToday} monthCount={leadsMonth} />
            <StatCard
              title="Customers"
              todayCount={customersToday}
              monthCount={customersMonth}
            />
            <StatCard
              title="Tasks"
              todayLabel="To-Do"
              todayCount={tasksToDo}
              monthLabel="Completed"
              monthCount={tasksCompleted}
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

            {/* Column 2 => Calendar + tasks */}
            <div className="flex flex-col h-[550px] min-h-0">
              <h2 className="text-2xl font-bold mb-2">Calendar</h2>
              <div className="bg-[#131313] rounded-md p-3 flex-1 w-full min-h-0 overflow-auto">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  // Indicate days with tasks
                  modifiers={{
                    hasTasks: (day) =>
                      calendarTasks.some((t) =>
                        isSameDay(new Date(t.created_at), day)
                      ),
                  }}
                  modifiersClassNames={{
                    hasTasks: "ring-2 ring-red-600 ring-offset-2",
                  }}
                  className="max-w-[400px] mx-auto mb-4"
                />

                <h3 className="text-lg font-semibold mt-2" ref={tasksRef}>
                  Tasks on {date.toDateString()}
                </h3>
                {selectedCalTasks.length === 0 ? (
                  <p className="text-gray-400 mt-1">No tasks for this date.</p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {selectedCalTasks.map((t) => {
                      // pick color based on status
                      const colorClass = getStatusColorClass(t.status)
                      return (
                        <div
                          key={t.id}
                          className="p-3 bg-[#1A1A1A] border border-[#1f1f1f] rounded-md cursor-pointer hover:bg-[#262626]"
                          onClick={() => handleCalendarTaskClick(t)}
                        >
                          <p className="text-white font-medium">{t.title}</p>

                          {/* colored dot + status */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`${colorClass} text-xl leading-none`}>•</span>
                            <p className="text-gray-400 text-sm">{t.status}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Column 3 => Chat */}
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold mb-2">MIA AI</h2>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center">
                  <CustomChatStart />
                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 w-full max-w-[600px] px-2"
                  >
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

        {/* If we have a selectedTask => open TaskDetailsModal */}
        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={handleCloseModal}
            onSave={handleSaveTask}
            shopId={shop?.id || ""}
          />
        )}
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
