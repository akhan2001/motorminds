"use client"
export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Bell, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaskBoard } from "@/components/task-board"
import { CalendarView } from "@/components/calendar-view"
import { MainNav } from "@/components/main-nav"
import { ViewToggle } from "@/components/view-toggle"
import { WorkOrderForm } from "@/components/work-order-form"
import { TaskListView } from "@/components/task-list-view"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { transformData } from "@/utils/dataTransform"
import { TaskDetailsModal, DetailedRepairOrder } from "@/components/task-details-modal"
import { v4 as uuidv4 } from "uuid"
import { Nav } from "@/app/components/nav"
import LoadingPage from "@/components/loading"
import { toast } from "sonner"
import { createCustomerVehicle, createNewCustomer } from "../customers/api/customer-utils"
import { createWorkOrder } from "./util/mechanics-hub-utils"

export default function MechanicsHub() {
  // New: read ?view=board or ?view=calendar or ?view=list
  const searchParams = useSearchParams()
  const queryView = searchParams?.get("view") as "board" | "calendar" | "list" | null

  // Default to "board" unless query param says otherwise
  const [currentView, setCurrentView] = useState<"board" | "calendar" | "list">("board")

  const [selectedTask, setSelectedTask] = useState<DetailedRepairOrder | null>(null)
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false)
  const [repairOrders, setRepairOrders] = useState({
    boardData: {},
    calendarData: {},
    listData: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const [shopId, setShopId] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  // If user navigates with ?view=..., update the local state
  useEffect(() => {
    if (
      queryView &&
      (queryView === "board" || queryView === "calendar" || queryView === "list")
    ) {
      setCurrentView(queryView)
    }
  }, [queryView])

  // Ensure user is logged in, then fetch existing orders
  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      await fetchRepairOrders(user.id)
    } else {
      router.push("/login")
    }
  }

  // Fetch existing repair orders & transform them
  async function fetchRepairOrders(userId: string) {
    setIsLoading(true)
    try {
      // get shop_id
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("shop_id")
        .eq("id", userId)
        .single()
      if (userErr) throw userErr
      if (!userData?.shop_id) throw new Error("No shop_id found")

      setShopId(userData.shop_id)

      // fetch repair_orders with details, customers, vehicles
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
        .eq("shop_id", userData.shop_id)
        .order("created_at", { ascending: false })
      if (error) throw error

      if (!data) return
      const transformed = transformData(data)
      setRepairOrders(transformed)
    } catch (err) {
      console.error("fetchRepairOrders error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * handleStatusChange: if a task is dragged to a new column in TaskBoard,
   * we update "repair_orders.status" in DB, then re-fetch
   */
  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("repair_orders")
        .update({ status: newStatus })
        .eq("id", taskId)
      if (error) throw error

      if (user?.id) {
        await fetchRepairOrders(user.id)
      }
    } catch (err) {
      console.error("handleStatusChange error:", err)
    }
  }

  /**
   * handleTaskClick: when a minimal task is clicked from board/calendar/list,
   * we fetch a full record for editing in TaskDetailsModal
   */
  async function handleTaskClick(minimalTask: any) {
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
        .eq("id", minimalTask.id)
        .single()
      if (error) {
        console.error("Error fetching single record:", error)
        return
      }
      setSelectedTask(data)
    } catch (err) {
      console.error("Unexpected error in handleTaskClick:", err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * handleSaveTask: saving changes from TaskDetailsModal
   */
  async function handleSaveTask(updated: DetailedRepairOrder) {
    try {
      // 1) update status in "repair_orders"
      const { error: mainErr } = await supabase
        .from("repair_orders")
        .update({ status: updated.status })
        .eq("id", updated.id)
      if (mainErr) throw mainErr

      // 2) update first row in repair_order_details if any
      const detail = updated.repair_order_details?.[0]
      if (detail?.id) {
        const { error: detailErr } = await supabase
          .from("repair_order_details")
          .update({
            labour: detail.labour,
            labour_cost: detail.labour_cost,
            parts: detail.parts,
            parts_cost: detail.parts_cost,
            notes: detail.notes,
            cost: detail.cost,
            mileage: detail.mileage,
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

      // 4) update the specific vehicle associated with this repair order
      if (updated.vehicle_id) {
        const vehicleToUpdate = updated.customers?.customer_vehicles?.find(
          v => v.id === updated.vehicle_id
        );
        
        if (vehicleToUpdate) {
          const { error: vehicleErr } = await supabase
            .from("customer_vehicles")
            .update({
              year: vehicleToUpdate.year,
              make: vehicleToUpdate.make,
              model: vehicleToUpdate.model,
              engine_type: vehicleToUpdate.engine_type,
              vin: vehicleToUpdate.vin,
            })
            .eq("id", vehicleToUpdate.id)
          if (vehicleErr) throw vehicleErr
        }
      }

      if (user?.id) {
        await fetchRepairOrders(user.id)
      }
      setSelectedTask(null)
    } catch (err) {
      console.error("handleSaveTask error:", err)
    }
  }

  function handleViewChange(view: "board" | "calendar" | "list") {
    setCurrentView(view)
  }

  /**
   * handleSaveWorkOrder: insertion logic so the 'vehicle_id' in 'repair_orders'
   * is always a valid reference to 'customer_vehicles.id'
   */

    async function handleSaveWorkOrder(formData: any) {
        console.log("shopId", shopId)
        console.log(formData)

        // create customer
        if (formData.customerId === "new") {
            try {
                const customer = await createNewCustomer(formData, shopId || "")
                console.log("customer", customer)
            } catch (err: any) {
                console.error("Error creating customer:", err)
                toast.error("Error creating customer: " + err.message)
            }
        }
        
        // create vehicle
        // if vehicle_id is new, create new vehicle
        const vehicleData = {
            year: formData.year,
            make: formData.make,
            model: formData.model,
            engine_type: formData.engineType,
            vin: formData.vin,
            color: formData.color,
            mileage: formData.mileage,
        }

        if (formData.vehicleId === "new") {
            try {
                const vehicle = await createCustomerVehicle(formData.customerId, vehicleData)
                console.log("vehicle", vehicle)
            } catch (err: any) {
                console.error("Error creating vehicle:", err)
                toast.error("Error creating vehicle: " + err.message)
            }
        }

        // create work order
        const workOrderData = {
            shop_id: shopId || "",
            customer_id: formData.customerId,
            vehicle_id: formData.vehicleId,
            status: "Pending",
            created_at: new Date().toISOString(),
        }

        try {
            const workOrder = await createWorkOrder(workOrderData)
            console.log("workOrder", workOrder)
        } catch (err: any) {
            console.error("Error creating work order:", err)
            toast.error("Error creating work order: " + err.message)
        }

        router.refresh()
    }

  function handleCloseModal() {
    setSelectedTask(null)
  }

  if (isLoading) {
    return <LoadingPage page="Mechanic Hub" />
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top Navigation */}
      <Nav activeLink="Mechanic Hub" />

      <main className="flex-1 flex flex-col p-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8 shrink-0"
        >
          <p className="text-[#9d9d9d] mb-1"></p>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-8 bg-[#b22222]" />
              Mechanics Hub
            </h1>
            <Button
              className="bg-[#b22222] hover:bg-[#e23232] rounded-full px-8 py-2.5 h-auto"
              onClick={() => setIsWorkOrderFormOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" /> ADD NEW JOB
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-8"
        >
          {/* Existing Toggle: "board" | "calendar" plus link to /tasks */}
          {currentView !== "list" && <ViewToggle onViewChange={handleViewChange} />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex-1 min-h-0 overflow-auto"
        >
          {currentView === "board" && (
            <TaskBoard
              tasks={repairOrders.boardData}
              onTaskClick={handleTaskClick}
              onStatusChange={handleStatusChange}
            />
          )}
          {currentView === "calendar" && (
            <CalendarView tasks={repairOrders.calendarData} onTaskClick={handleTaskClick} />
          )}
          {currentView === "list" && (
            <TaskListView tasks={repairOrders.listData} onTaskClick={handleTaskClick} />
          )}
        </motion.div>
      </main>

      {isWorkOrderFormOpen && (
        <WorkOrderForm
          onClose={() => setIsWorkOrderFormOpen(false)}
          onSave={handleSaveWorkOrder}
          onAddTask={() => {}}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={handleCloseModal}
          onSave={handleSaveTask}
          shopId={shopId || ""}
        />
      )}
    </div>
  )
}
