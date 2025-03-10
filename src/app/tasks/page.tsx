"use client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TasksTable } from "@/components/tasks-table"
import { TaskStats } from "@/components/task-stats"
import { WorkOrderForm } from "@/components/work-order-form"

// IMPORTANT: Import your "DetailedRepairOrder" and modal
import { TaskDetailsModal, DetailedRepairOrder } from "@/components/task-details-modal"

import { useTasks } from "@/contexts/tasks-context"
import type { Task } from "@/types/task"
import { supabase } from "@/lib/supabase"
import { TasksProvider } from '@/contexts/tasks-context'
import { Nav } from "../components/nav"

export default function TasksPage() {
  const router = useRouter()
  
  const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false)

  const [selectedTask, setSelectedTask] = useState<DetailedRepairOrder | null>(null)


  const { tasks, setTasks } = useTasks()

  // Check user + fetch tasks on mount
  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    // Find shop_id for user
    const { data: userData, error: userErr } = await supabase
      .from("users")
      .select("shop_id")
      .eq("id", user.id)
      .single()

    if (userErr || !userData?.shop_id) {
      console.error("No shop_id found or error:", userErr)
      return
    }

    await fetchTasks(userData.shop_id)
  }

  /**
   * Fetch minimal tasks for the table + stats
   * Includes the 'shop_staff.staff_name' in the first detail row
   * for display in the table's 'assignedTo' column if you want that.
   */
  async function fetchTasks(shopId: string) {
    try {
      // If your relationship is named exactly `shop_staff`, use that:
      // If it's named something else (like `shop_staff_by_mechanic_id`),
      // then replace `shop_staff(*)` with that name.
      const { data, error } = await supabase
        .from("repair_orders")
        .select(`
          id,
          status,
          created_at,
          repair_order_details(
            description,
            notes,
            task_priority,
            mechanic_id,
            shop_staff(*)
          ),
          customers(
            customer_vehicles(
              year,
              make,
              model,
              engine_type,
              vin
            )
          )
        `)
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching tasks:", error)
        setTasks([])
        return
      }
      if (!data) {
        setTasks([])
        return
      }

      // Transform DB rows => minimal 'Task' for listing
      const transformed: Task[] = data.map((row: any) => {
        const detail = row.repair_order_details?.[0] || {}
        const staffName = detail.shop_staff?.staff_name || "Unassigned"

        const vehicleObj = row.customers?.customer_vehicles?.[0] || {}
        const vehicleStr =
          vehicleObj.year || vehicleObj.make || vehicleObj.model
            ? `${vehicleObj.year ?? ""} ${vehicleObj.make ?? ""} ${vehicleObj.model ?? ""}`.trim()
            : "Unknown Vehicle"

        const timeStr = new Date(row.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })

        return {
          id: row.id,
          title: detail.description || "Untitled",
          assignedTo: staffName,
          time: timeStr,
          status: row.status || "Pending", // "Pending", "In Progress", "Completed"
          difficulty: detail.task_priority || "",
          vehicle: vehicleStr,
          comments: detail.notes || "",
        }
      })

      setTasks(transformed)
    } catch (err) {
      console.error("Unexpected error fetching tasks:", err)
      setTasks([])
    }
  }

  /**
   * Minimal "Add Task" from the WorkOrderForm
   */
  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask])
    setIsWorkOrderFormOpen(false)
  }

  /**
   * When the user clicks a row in the table,
   * fetch the *full* record (including shop_staff) 
   * so we can show it in TaskDetailsModal.
   */
  async function handleTaskClick(minimalTask: Task) {
    try {
      // CRITICAL: If your foreign key relationship is named something else,
      // use that. E.g. `shop_staff_by_mechanic_id(*)`
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
        .eq("id", minimalTask.id)
        .single()

      if (error) {
        console.error("Error fetching full record:", error)
        return
      }
      if (!data) {
        console.warn("No data found for repair_order id:", minimalTask.id)
        return
      }

      // Now 'data.repair_order_details[0].shop_staff.staff_name' should exist
      setSelectedTask(data)
    } catch (err) {
      console.error("Error in handleTaskClick:", err)
    }
  }

  /**
   * Close the TaskDetailsModal
   */
  const handleCloseModal = () => {
    setSelectedTask(null)
  }

  /**
   * Save changes from the detailed modal
   */
  async function handleSaveTask(updated: DetailedRepairOrder) {
    try {
      // Update 'repair_orders' main fields
      const { error: mainErr } = await supabase
        .from("repair_orders")
        .update({ status: updated.status })
        .eq("id", updated.id)
      if (mainErr) throw mainErr

      // Update the first detail row if present
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
            task_priority: detail.task_priority,
            description: detail.description,
          })
          .eq("id", detail.id)
        if (detailErr) throw detailErr
      }

      // Update the customer name if changed
      if (updated.customers?.id) {
        const { error: custErr } = await supabase
          .from("customers")
          .update({ customer_name: updated.customers.customer_name })
          .eq("id", updated.customers.id)
        if (custErr) throw custErr
      }

      // Update the first vehicle if changed
      const veh = updated.customers?.customer_vehicles?.[0]
      if (veh?.id) {
        const { error: vehErr } = await supabase
          .from("customer_vehicles")
          .update({
            year: veh.year,
            make: veh.make,
            model: veh.model,
            engine_type: veh.engine_type,
            vin: veh.vin,
          })
          .eq("id", veh.id)
        if (vehErr) throw vehErr
      }

      // Re-fetch tasks so table + stats stay in sync
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("shop_id")
          .eq("id", user.id)
          .single()

        if (userData?.shop_id) {
          await fetchTasks(userData.shop_id)
        }
      }

      setSelectedTask(null)
    } catch (err) {
      console.error("Error saving task changes:", err)
    }
  }

  /**
   * If the work order form returns data, handle it
   */
  const handleSaveWorkOrder = (data: any) => {
    console.log("handleSaveWorkOrder => got data:", data)
    // Possibly re-fetch tasks or push the new item
  }

  return (
    <TasksProvider>
      <div className="min-h-screen bg-black flex flex-col">
       <Nav activeLink="Tasks"/>

        {/* Main content */}
        <main className="flex-1 flex flex-col p-6 min-h-0">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-2">
              <div className="w-1 h-8 bg-[#b22222]" />
              Tasks
            </h1>
          </div>

          {/* Stats (uses tasks from context) */}
          <TaskStats />

          <div className="mt-8 bg-[#1A1A1A] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Task List</h2>
              <Button
                className="bg-[#b22222] hover:bg-[#e23232] text-white transition-colors duration-200"
                onClick={() => setIsWorkOrderFormOpen(true)}
              >
                <Plus className="mr-2 h-5 w-5" /> ADD NEW TASK
              </Button>
            </div>
            {/* Table that calls handleTaskClick on row click */}
            <TasksTable tasks={tasks} onTaskClick={handleTaskClick} />
          </div>
        </main>

        {/* Work Order Form (add new tasks) */}
        {isWorkOrderFormOpen && (
          <WorkOrderForm
            onClose={() => setIsWorkOrderFormOpen(false)}
            onSave={handleSaveWorkOrder}
            onAddTask={handleAddTask}
          />
        )}

        {/* Detailed modal for editing mechanic name, etc. */}
        {selectedTask && (
          <TaskDetailsModal
            task={selectedTask}
            onClose={handleCloseModal}
            onSave={handleSaveTask}
          />
        )}
      </div>
    </TasksProvider>
  )
}
