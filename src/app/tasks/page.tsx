"use client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { ViewToggleToHub } from "@/components/view-toggle-to-hub"  // <--- NEW import
import { Button } from "@/components/ui/button"
import { TasksTable } from "@/components/tasks-table"
import { TaskStats } from "@/components/task-stats"
import { WorkOrderForm } from "@/components/work-order-form"
import { TaskDetailsModal, DetailedRepairOrder } from "@/components/task-details-modal"
import LoadingPage from "@/components/loading"
import { Nav } from "@/app/components/nav"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

interface Task {
  id: string
  title: string
  assignedTo?: string
  time?: string
  status: "Pending" | "In Progress" | "Completed"
  difficulty?: string
  vehicle?: string
  comments?: string
}

export default function TasksPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [shopId, setShopId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskFilter, setTaskFilter] = useState<"all" | "Pending" | "In Progress" | "Completed">("all")
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<DetailedRepairOrder | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

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

  async function fetchRepairOrders(userId: string) {
    setIsLoading(true)
    try {
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("shop_id")
        .eq("id", userId)
        .single()
      if (userErr) throw userErr
      if (!userData?.shop_id) throw new Error("No shop_id found")

      setShopId(userData.shop_id)

      const { data, error } = await supabase
        .from("repair_orders")
        .select(`
          *,
          repair_order_details(
            *,
            shop_staff(*)
          ),
          customers(
            *,
            customer_vehicles(*)
          )
        `)
        .eq("shop_id", userData.shop_id)
        .order("created_at", { ascending: false })
      if (error) throw error

      if (!data) {
        setTasks([])
        return
      }

      const mappedTasks: Task[] = data.map((row: any) => {
        const detail = row.repair_order_details?.[0] || {}
        const vehicleInfo = row.customers?.customer_vehicles?.[0]
        const year = vehicleInfo?.year || ""
        const make = vehicleInfo?.make || ""
        const model = vehicleInfo?.model || ""
        const vehicleStr = [year, make, model].filter(Boolean).join(" ")

        return {
          id: row.id,
          title: detail.description || "Untitled",
          assignedTo: detail.shop_staff?.staff_name || "???",
          time: new Date(row.created_at).toLocaleString(),
          status: (row.status as Task["status"]) || "Pending",
          difficulty: detail.task_priority || "",
          vehicle: vehicleStr || "--",
          comments: detail.notes || "",
        }
      })

      setTasks(mappedTasks)
    } catch (err) {
      console.error("fetchRepairOrders error:", err)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTaskClick(minimalTask: Task) {
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
      if (!data) {
        console.warn("No data returned for id:", minimalTask.id)
        return
      }
      setSelectedTask(data)
    } catch (err) {
      console.error("Unexpected error in handleTaskClick:", err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveTask(updated: DetailedRepairOrder) {
    try {
      const { error: mainErr } = await supabase
        .from("repair_orders")
        .update({ status: updated.status })
        .eq("id", updated.id)
      if (mainErr) throw mainErr

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

      if (updated.customers?.id) {
        const { error: custErr } = await supabase
          .from("customers")
          .update({ customer_name: updated.customers.customer_name })
          .eq("id", updated.customers.id)
        if (custErr) throw custErr
      }

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

  async function handleSaveWorkOrder(formData: any) {
    if (!user?.id) return
    console.log("Create new order with data:", formData)

    try {
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("shop_id")
        .eq("id", user.id)
        .single()
      if (userErr) throw userErr
      if (!userData?.shop_id) throw new Error("No shop_id found")

      let customerId = formData.customerId
      let vehicleId: string | null = null

      if (customerId === "new" || !customerId) {
        const newCustomerId = uuidv4()
        const { error: custErr } = await supabase
          .from("customers")
          .insert({
            id: newCustomerId,
            customer_name: formData.customerName,
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
          throw new Error("No vehicle info provided for new customer.")
        }

        customerId = newCustomerId
      } else {
        const { data: existingVeh, error: existVehErr } = await supabase
          .from("customer_vehicles")
          .select("id")
          .eq("customer_id", customerId)
          .limit(1)
        if (existVehErr) throw existVehErr

        if (!existingVeh || existingVeh.length === 0) {
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
            throw new Error("Existing customer has no vehicle + no new vehicle info.")
          }
        } else {
          vehicleId = existingVeh[0].id
        }
      }

      if (!vehicleId) {
        throw new Error("No valid vehicle_id found or created.")
      }

      const newRepairOrderId = uuidv4()
      const { error: orderErr } = await supabase
        .from("repair_orders")
        .insert({
          id: newRepairOrderId,
          shop_id: userData.shop_id,
          customer_id: customerId,
          vehicle_id: vehicleId,
          status: "Pending",
          created_at: new Date().toISOString(),
        })
        .single()
      if (orderErr) throw orderErr

      const newDetailId = uuidv4()
      const { error: detailErr } = await supabase
        .from("repair_order_details")
        .insert({
          id: newDetailId,
          repair_order_id: newRepairOrderId,
          description: formData.taskName,
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

  const filteredTasks =
    taskFilter === "all" ? tasks : tasks.filter((t) => t.status === taskFilter)

  if (isLoading) {
    return <LoadingPage page="TasksPage" />
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Nav activeLink="Tasks" />

      <main className="flex-1 flex flex-col p-6 min-h-0">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-2">
            <div className="w-1 h-8 bg-[#b22222]" />
            Tasks
          </h1>
        </div>

        {/* NEW: Toggle that sends the user back to Mechanic Hub. 
            You can place this anywhere you'd like (top, next to heading, etc.). */}
        <div className="mb-4">
          <ViewToggleToHub showListView={false} />
        </div>

        <TaskStats
          tasks={tasks}
          currentFilter={taskFilter}
          onFilterChange={(status) => setTaskFilter(status)}
        />

        <div className="mt-8 bg-[#1A1A1A] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Task List</h2>
            <Button
              className="bg-[#b22222] hover:bg-[#e23232] text-white"
              onClick={() => setIsWorkOrderFormOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" /> ADD NEW TASK
            </Button>
          </div>

          <TasksTable tasks={filteredTasks} onTaskClick={handleTaskClick} />
        </div>
      </main>

      {isWorkOrderFormOpen && (
        <WorkOrderForm
          onClose={() => setIsWorkOrderFormOpen(false)}
          onSave={handleSaveWorkOrder}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          shopId={shopId || ""}
        />
      )}
    </div>
  )
}
