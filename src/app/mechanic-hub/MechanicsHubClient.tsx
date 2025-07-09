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
import { createCustomerRetention, createWorkOrder } from "./util/mechanics-hub-utils"
import { MechanicsHubSidebar } from "./components/MechanicsHubSidebar"
import { getOrGenerateMiaInsights } from "../mia/utils/insightsGenerator"
import { createCustomerLead } from "../lead-generation/utils/lead"

interface RepairOrderItem {
  id: string
  title: string
  status: "todo" | "inProgress" | "done"
  statusColor: string
  vehicle: string
  date: string
  [key: string]: any
}

interface TransformedData {
  boardData: {
    todo: RepairOrderItem[]
    inProgress: RepairOrderItem[]
    done: RepairOrderItem[]
  }
  calendarData: { [date: string]: RepairOrderItem[] }
  listData: RepairOrderItem[]
}

export default function MechanicsHub() {
  // New: read ?view=board or ?view=calendar or ?view=list
  const searchParams = useSearchParams()
  const queryView = searchParams?.get("view") as "board" | "calendar" | "list" | null

  // Default to "board" unless query param says otherwise
  const [currentView, setCurrentView] = useState<"board" | "calendar" | "list">("board")

  const [selectedTask, setSelectedTask] = useState<DetailedRepairOrder | null>(null)
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false)
  const [repairOrders, setRepairOrders] = useState<TransformedData>({
    boardData: { todo: [], inProgress: [], done: [] },
    calendarData: {},
    listData: []
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
      // Update the database
      const { error } = await supabase
        .from("repair_orders")
        .update({ status: newStatus })
        .eq("id", taskId)
      if (error) throw error

      // Update local state without fetching from server
      setRepairOrders((prev) => {
        const newBoardData = { ...prev.boardData }
        const newCalendarData = { ...prev.calendarData }
        const newListData = [...prev.listData]

        // Find the task in all data structures
        let taskToUpdate: RepairOrderItem | null = null
        let sourceColumn: string | null = null

        // Check in board data
        for (const [column, tasks] of Object.entries(newBoardData)) {
          const taskIndex = tasks.findIndex((t) => t.id === taskId)
          if (taskIndex !== -1) {
            taskToUpdate = tasks[taskIndex]
            sourceColumn = column
            tasks.splice(taskIndex, 1)
            break
          }
        }

        if (taskToUpdate) {
          // Update the task's status
          const localStatus = mapDbStatusToLocal(newStatus)
          taskToUpdate.status = localStatus
          taskToUpdate.statusColor = getStatusColor(localStatus)

          // Add to the new column
          newBoardData[localStatus].push(taskToUpdate)

          // Update calendar data
          const dateKey = taskToUpdate.date.split('T')[0]
          if (newCalendarData[dateKey]) {
            const calendarTaskIndex = newCalendarData[dateKey].findIndex((t) => t.id === taskId)
            if (calendarTaskIndex !== -1) {
              newCalendarData[dateKey][calendarTaskIndex] = taskToUpdate
            }
          }

          // Update list data
          const listTaskIndex = newListData.findIndex((t) => t.id === taskId)
          if (listTaskIndex !== -1) {
            newListData[listTaskIndex] = taskToUpdate
          }
        }

        return {
          boardData: newBoardData,
          calendarData: newCalendarData,
          listData: newListData
        }
      })
    } catch (err) {
      console.error("handleStatusChange error:", err)
      throw err // Re-throw to let the TaskBoard component handle the error
    }
  }

  // Helper function to map DB status to local status
  function mapDbStatusToLocal(dbStatus: string): "todo" | "inProgress" | "done" {
    switch (dbStatus) {
      case "Pending":
        return "todo"
      case "In Progress":
        return "inProgress"
      case "Completed":
        return "done"
      default:
        return "todo"
    }
  }

  // Helper function to get status color
  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "pending":
      case "todo":
        return "#e23232"
      case "in progress":
      case "inprogress":
        return "#d6cd24"
      case "completed":
      case "done":
        return "#1eb386"
      default:
        return "#e23232"
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
      
      // Ensure we have the vehicle_id for highlighting the correct vehicle
      if (data && !data.vehicle_id) {
        console.warn("No vehicle_id found in repair order, attempting to fix display")
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
            labour_cost: detail.labour_cost,
            parts_cost: detail.parts_cost,
            description: detail.description,
            task_priority: detail.task_priority,
            mechanic_id: detail.mechanic_id
          })
          .eq("id", detail.id)
        if (detailErr) throw detailErr
      }

      // 3) update "customers" if changed
      if (updated.customers?.id) {
        const { error: custErr } = await supabase
          .from("customers")
          .update({ 
            customer_name: updated.customers.customer_name,
            customer_email: updated.customers.customer_email,
            customer_phone: updated.customers.customer_phone
          })
          .eq("id", updated.customers.id)
        if (custErr) throw custErr
      }

      // 4) update the specific vehicle associated with this repair order
      if (updated.vehicle_id && updated.customers?.customer_vehicles) {
        const vehicleToUpdate = updated.customers.customer_vehicles.find(
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
    if (!user?.id) return

    try {
        const { data: userData, error: userErr } = await supabase
            .from("users")
            .select("shop_id")
            .eq("id", user.id)
            .single()
        if (userErr) throw userErr
        if (!userData?.shop_id) throw new Error("No shop_id found")

        const shopId = userData.shop_id
        let customerId = formData.customerId
        let vehicleId: string | null = null

        function parseDouble(str: string) {
            if (!str || str.trim() === "") return null
            return parseFloat(str)
        }

        function parseString(str: string) {
            if (!str || str.trim() === "") return null
            return str.trim()
        }

        if (customerId === "new" || !customerId) {
            const newCustomer = await createNewCustomer(
                {
                    customer_name: formData.customerName,
                    customer_phone: formData.customerPhone,
                    customer_email: formData.customerEmail,
                    customer_address: formData.customerAddress,
                },
                shopId
            );
            if (!newCustomer) throw new Error("Could not create customer.")
            customerId = newCustomer.id
            
            const newVehicle = await createCustomerVehicle(
                customerId,
                {
                    year: formData.year,
                    make: formData.make,
                    model: formData.model,
                    engine_type: formData.engineType,
                    vin: formData.vin,
                    color: formData.color,
                    license_plate: formData.licensePlate,
                    mileage: formData.mileage,
                }
            );
            if (!newVehicle) throw new Error("Could not create vehicle.")
            vehicleId = newVehicle.id;

        } else {
            if (formData.selectedVehicleId === "new") {
                const newVehicle = await createCustomerVehicle(
                    customerId,
                    {
                        year: formData.year,
                        make: formData.make,
                        model: formData.model,
                        engine_type: formData.engineType,
                        vin: formData.vin,
                        color: formData.color,
                        license_plate: formData.licensePlate,
                        mileage: formData.mileage,
                    }
                );
                if (!newVehicle) throw new Error("Could not create vehicle.")
                vehicleId = newVehicle.id;
            } else {
                vehicleId = formData.selectedVehicleId;
            }
        }

        if (!vehicleId) {
            throw new Error("No valid vehicle_id found or created.")
        }

        const workOrderPayload = {
            id: uuidv4(),
            shop_id: shopId,
            customer_id: customerId,
            vehicle_id: vehicleId,
            status: "Pending",
            repair_order_details: [
                {
                    description: formData.taskName,
                    mechanic_id: formData.assignedTo || null,
                    labour: formData.labor,
                    parts: formData.parts,
                    notes: formData.notes,
                    cost: parseDouble(formData.totalAmount),
                    labour_cost: parseDouble(formData.laborCost),
                    parts_cost: parseDouble(formData.partsCost),
                    task_priority: parseString(formData.priority),
                    mileage: formData.mileage
                },
            ],
        }

        const newWorkOrder = await createWorkOrder(workOrderPayload)
        
        await createCustomerLead(newWorkOrder[0].id)
        await getOrGenerateMiaInsights(newWorkOrder[0].id, shopId, 'immediate')

        toast.success("Work Order successfully created!")

        await fetchRepairOrders(user.id)
        
        await handleTaskClick({ id: newWorkOrder[0].id });

    } catch (err: any) {
        console.error("Error creating work order:", err)
        toast.error("Error creating work order: " + err.message)
    } finally {
        setIsWorkOrderFormOpen(false)
    }
  }

  async function handleCloseWorkOrder(workOrderId: string) {
    //This will generate Mia AI Insights for the work order when it is completed / closed
    if (shopId) {
      getOrGenerateMiaInsights(workOrderId, shopId!, "future")
      //closeWorkOrder(workOrderId) // TODO: Implement this function
      toast.success("Work Order closed")
      await fetchRepairOrders(user.id)
    } else {
      toast.error("Shop ID not found")
      console.error("Shop ID not found")
      return
    }
  }

  function handleCloseModal() {
    setSelectedTask(null)
  }

  if (isLoading) {
    return <LoadingPage />
  }

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white">
      <Nav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#131313] px-6 py-4 flex items-center justify-between border-b border-[#222222]">
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
        </header>

        <main className="flex-1 overflow-hidden">
            {isWorkOrderFormOpen && (
              <WorkOrderForm
                onClose={() => setIsWorkOrderFormOpen(false)}
                onSave={handleSaveWorkOrder}
              />
            )}

            {selectedTask && (
              <TaskDetailsModal
                task={selectedTask}
                onClose={handleCloseModal}
                onSave={handleSaveTask}
                shopId={shopId!}
              />
            )}

            {currentView === "board" && (
              <TaskBoard
                tasks={repairOrders.boardData}
                onStatusChange={handleStatusChange}
                onTaskClick={handleTaskClick}
              />
            )}
            {currentView === "calendar" && (
              <CalendarView tasks={repairOrders.calendarData} onTaskClick={handleTaskClick} />
            )}
            {currentView === "list" && <TaskListView />}
        </main>
      </div>
    </div>
  )
}
