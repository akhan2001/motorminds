"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export default function MechanicsHub() {
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

  useEffect(() => {
    checkUser()
  }, [])

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
            parts: detail.parts,
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
    if (!user?.id) return
    console.log("Create new order with data:", formData)

    try {
      // get shop_id for this user
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("shop_id")
        .eq("id", user.id)
        .single()
      if (userErr) throw userErr
      if (!userData?.shop_id) throw new Error("No shop_id found")

      let customerId = formData.customerId
      let vehicleId: string | null = null

      // 1) If "new" customer => insert into customers, shop_customers, new vehicle row
      if (customerId === "new" || !customerId) {
        const newCustomerId = uuidv4()
        const { error: custErr } = await supabase
          .from("customers")
          .insert({
            id: newCustomerId,
            customer_name: formData.customerName,
            // Insert a valid or null email to avoid unique constraint issues
            customer_email: null, 
          })
          .single()
        if (custErr) throw custErr

        const { error: shopCustErr } = await supabase
          .from("shop_customers")
          .insert({
            id: uuidv4(),
            shop_id: userData.shop_id,
            customer_id: newCustomerId,
            created_at: new Date().toISOString(),
          })
          .single()
        if (shopCustErr) throw shopCustErr

        // If the user typed year/make/model, etc., create a new vehicle
        if (
          formData.year ||
          formData.make ||
          formData.model ||
          formData.engineType ||
          formData.vin
        ) {
          const newVehId = uuidv4()
          const { error: vehErr } = await supabase
            .from("customer_vehicles")
            .insert({
              id: newVehId,
              customer_id: newCustomerId,
              year: formData.year,
              make: formData.make,
              model: formData.model,
              engine_type: formData.engineType,
              vin: formData.vin,
            })
            .single()
          if (vehErr) throw vehErr

          vehicleId = newVehId
        } else {
          // If we have a not-null vehicle_id constraint but no data => error
          throw new Error("No vehicle info provided for new customer, can't create a valid vehicle_id.")
        }

        customerId = newCustomerId
      } else {
        // 2) Existing customer => find or create vehicle row
        // fetch the first existing vehicle
        const { data: existingVeh, error: existVehErr } = await supabase
          .from("customer_vehicles")
          .select("id")
          .eq("customer_id", customerId)
          .limit(1)
        if (existVehErr) throw existVehErr

        if (!existingVeh || existingVeh.length === 0) {
          // If user typed new vehicle data => insert
          if (
            formData.year ||
            formData.make ||
            formData.model ||
            formData.engineType ||
            formData.vin
          ) {
            const newVehId = uuidv4()
            const { error: vehErr } = await supabase
              .from("customer_vehicles")
              .insert({
                id: newVehId,
                customer_id: customerId,
                year: formData.year,
                make: formData.make,
                model: formData.model,
                engine_type: formData.engineType,
                vin: formData.vin,
              })
              .single()
            if (vehErr) throw vehErr
            vehicleId = newVehId
          } else {
            // No existing vehicle, no typed data => error
            throw new Error(
              "Existing customer has no vehicle on file and no new vehicle info given. " +
              "Can't proceed because vehicle_id must be not null."
            )
          }
        } else {
          // use existing vehicle's id
          vehicleId = existingVeh[0].id
        }
      }

      if (!vehicleId) {
        throw new Error("No valid vehicle_id found or created.")
      }

      // 3) Insert row in "repair_orders" referencing that vehicle_id
      const newRepairOrderId = uuidv4()
      const { error: orderErr } = await supabase
        .from("repair_orders")
        .insert({
          id: newRepairOrderId,
          shop_id: userData.shop_id,
          customer_id: customerId,
          vehicle_id: vehicleId, // non-null
          status: "Pending",
          created_at: new Date().toISOString(),
        })
        .single()
      if (orderErr) throw orderErr

      // 4) Insert row in "repair_order_details"
      const newDetailId = uuidv4()
      const { error: detailErr } = await supabase
        .from("repair_order_details")
        .insert({
          id: newDetailId,
          repair_order_id: newRepairOrderId,
          description: formData.taskName, // store "Task Name"
          labour: formData.labor,
          parts: formData.parts,
          notes: formData.notes,
          cost: formData.totalAmount,
          mileage: formData.mileage,
          task_priority: formData.priority,
          mechanic_id: formData.assignedTo,
        })
        .single()
      if (detailErr) throw detailErr

      alert("Work Order successfully created!")
      await fetchRepairOrders(user.id)
    } catch (err: any) {
      console.error("Error creating work order:", err)
      alert("Error creating work order: " + err.message)
    } finally {
      setIsWorkOrderFormOpen(false)
    }
  }

  function handleCloseModal() {
    setSelectedTask(null)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-[#151515] flex flex-col">
      {/* Top Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 bg-[#131313]"
      >
        <div className="flex items-center px-6 py-3 bg-[#1a1a1a] rounded-[32px]">
          <div className="flex items-center gap-2 font-semibold text-white">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/MOTORMINDS-xT1F9wcHLYqhjkFz1dJwcACLAPUey3.png"
              alt="Motorminds Logo"
              className="h-8 w-8"
            />
            <span>Motorminds</span>
          </div>
          <MainNav />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#2d2d2d]">
              <Bell className="h-5 w-5" />
            </Button>
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>MM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </motion.div>

      <main className="flex-1 flex flex-col p-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8 shrink-0"
        >
          <p className="text-[#9d9d9d] mb-1">Hussain's</p>
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
        />
      )}
    </div>
  )
}
