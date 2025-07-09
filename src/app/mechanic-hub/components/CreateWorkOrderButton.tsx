'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { WorkOrderForm } from "@/components/work-order-form"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { createMiaInsights } from "../util/mechanics-hub-utils"
import { createCustomerLead } from "../../lead-generation/utils/lead"

interface CreateWorkOrderButtonProps {
    shopId: string
    onWorkOrderCreated?: () => void
}

export function CreateWorkOrderButton({ shopId, onWorkOrderCreated }: CreateWorkOrderButtonProps) {
    const [isWorkOrderFormOpen, setIsWorkOrderFormOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Helper to convert empty string -> null, otherwise parse float
    function parseDouble(str: string) {
        if (!str || str.trim() === "") return null // store NULL in DB
        return parseFloat(str) // attempts to parse; can be NaN if user typed nonsense
    }

    // Helper to convert empty string -> null for text fields
    function parseString(str: string) {
        if (!str || str.trim() === "") return null // store NULL in DB
        return str.trim() // return trimmed string
    }

    async function handleSaveWorkOrder(formData: any) {
        if (isSubmitting) return; // Prevent multiple submissions
        
        if (!shopId) {
            toast.error("Shop ID is required")
            return
        }

        setIsSubmitting(true); // Start submission
        console.log("Create new order with data:", formData)

        try {
            let customerId = formData.customerId
            let vehicleId: string | null = null

            // 2) If "new" customer => insert into `customers` (with `shop_id`) then vehicle
            if (customerId === "new" || !customerId) {
                const newCustomerId = uuidv4()
                console.log("Inserting new customer with ID =", newCustomerId)

                const { data: insertedCustomer, error: custErr } = await supabase
                    .from("customers")
                    .insert({
                        id: newCustomerId,
                        shop_id: shopId,
                        customer_name: formData.customerName || "Unnamed",
                        customer_phone: formData.customerPhone,
                        customer_email: parseString(formData.customerEmail),
                        customer_address: parseString(formData.customerAddress),
                        created_at: new Date().toISOString(),
                    })
                    .single()
                if (custErr) throw custErr

                // If user typed year/make/model => create a new vehicle
                if (
                    formData.year ||
                    formData.make ||
                    formData.model ||
                    formData.engineType ||
                    formData.vin
                ) {
                    const newVehId = uuidv4()
                    console.log("Inserting new vehicle with ID =", newVehId)

                    const { error: vehErr } = await supabase
                        .from("customer_vehicles")
                        .insert({
                            id: newVehId,
                            customer_id: newCustomerId,
                            year: parseString(formData.year),
                            make: parseString(formData.make),
                            model: parseString(formData.model),
                            engine_type: parseString(formData.engineType),
                            vin: parseString(formData.vin),
                        })
                        .single()
                    if (vehErr) throw vehErr

                    vehicleId = newVehId
                } else {
                    throw new Error(
                        "No vehicle info provided for new customer, can't create a valid vehicle_id."
                    )
                }
                customerId = newCustomerId
            } else {
                // 3) Existing customer => find or create vehicle
                const { data: existingCust, error: existCustErr } = await supabase
                    .from("customers")
                    .select("id, shop_id")
                    .eq("id", customerId)
                    .single()
                if (existCustErr) throw existCustErr
                if (!existingCust) throw new Error("Customer record not found.")
                if (existingCust.shop_id !== shopId) {
                    throw new Error("This customer does not belong to your shop.")
                }

                // Check existing vehicles
                const { data: existingVeh, error: existVehErr } = await supabase
                    .from("customer_vehicles")
                    .select("id")
                    .eq("customer_id", customerId)

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
                                year: parseString(formData.year),
                                make: parseString(formData.make),
                                model: parseString(formData.model),
                                engine_type: parseString(formData.engineType),
                                vin: parseString(formData.vin),
                            })
                            .single()
                        if (vehErr) throw vehErr
                        vehicleId = newVehId
                    } else {
                        throw new Error(
                            "Existing customer has no vehicle on file and no new vehicle info given."
                        )
                    }
                } else {
                    // If user selected a specific vehicle, use that ID
                    if (formData.selectedVehicleId && formData.selectedVehicleId !== "new") {
                        // Verify the selected vehicle exists and belongs to this customer
                        const selectedVehicleExists = existingVeh.some(v => v.id === formData.selectedVehicleId);
                        
                        if (selectedVehicleExists) {
                            vehicleId = formData.selectedVehicleId;
                        } else {
                            // If selected vehicle not found, create a new one if details provided
                            if (formData.year || formData.make || formData.model || formData.engineType || formData.vin) {
                                const newVehId = uuidv4();
                                const { error: vehErr } = await supabase
                                    .from("customer_vehicles")
                                    .insert({
                                        id: newVehId,
                                        customer_id: customerId,
                                        year: parseString(formData.year),
                                        make: parseString(formData.make),
                                        model: parseString(formData.model),
                                        engine_type: parseString(formData.engineType),
                                        vin: parseString(formData.vin),
                                    })
                                    .single();
                                if (vehErr) throw vehErr;
                                vehicleId = newVehId;
                            } else {
                                throw new Error("Selected vehicle not found and no vehicle details provided.");
                            }
                        }
                    }
                    // If user selected "new" but we have existing vehicles, create a new one
                    else if (formData.selectedVehicleId === "new") {
                        if (formData.year || formData.make || formData.model || formData.engineType || formData.vin) {
                            const newVehId = uuidv4();
                            const { error: vehErr } = await supabase
                                .from("customer_vehicles")
                                .insert({
                                    id: newVehId,
                                    customer_id: customerId,
                                    year: parseString(formData.year),
                                    make: parseString(formData.make),
                                    model: parseString(formData.model),
                                    engine_type: parseString(formData.engineType),
                                    vin: parseString(formData.vin),
                                })
                                .single();
                            if (vehErr) throw vehErr;
                            vehicleId = newVehId;
                        } else {
                            throw new Error("New vehicle selected but no vehicle details provided.");
                        }
                    }
                    // Default to first vehicle only if no selection was made
                    else {
                        vehicleId = existingVeh[0].id;
                    }
                }
            }

            if (!vehicleId) {
                throw new Error("No valid vehicle_id found or created.")
            }

            // 4) Insert into "repair_orders"
            const newRepairOrderId = uuidv4()
            const { error: orderErr } = await supabase
                .from("repair_orders")
                .insert({
                    id: newRepairOrderId,
                    shop_id: shopId,
                    customer_id: customerId,
                    vehicle_id: vehicleId,
                    status: "Pending",
                    created_at: new Date().toISOString(),
                })
                .single()
            if (orderErr) throw orderErr

            // 5) Insert into "repair_order_details"
            const newDetailId = uuidv4()
            const { error: detailErr } = await supabase
                .from("repair_order_details")
                .insert({
                    id: newDetailId,
                    repair_order_id: newRepairOrderId,
                    description: formData.taskName,
                    labour: parseString(formData.labor),    // use parseString to handle empty strings
                    parts: parseString(formData.parts),     // use parseString to handle empty strings
                    labour_cost: parseDouble(formData.laborCost),
                    parts_cost: parseDouble(formData.partsCost),
                    notes: parseString(formData.notes),     // use parseString to handle empty strings
                    cost: parseDouble(formData.totalAmount),
                    mileage: parseDouble(formData.mileage),
                    task_priority: formData.priority,
                    mechanic_id: formData.assignedTo === "" ? null : formData.assignedTo,
                })
                .single()
            if (detailErr) throw detailErr

            // Create Mia insights asynchronously
            createMiaInsights(newRepairOrderId, shopId, "immediate")
                .then(insightsResult => {
                    if (!insightsResult?.success) {
                        console.error("Background task: Failed to create Mia insights. The operation was unsuccessful.");
                    } else {
                        console.log("Background task: Successfully created Mia insights");
                    }
                })
                .catch(insightsError => {
                    console.error("Background task: Error creating Mia insights:", insightsError);
                });

            toast.success("Work Order successfully created!");

            // Create new lead
            try {
                createCustomerLead({
                    shop_id: shopId,
                    customer_id: customerId,
                    vehicle_id: vehicleId,
                    repair_order_id: newRepairOrderId,
                    lead_type: "new",
                    priority: "high",
                    timeframe: "immediate"
                })
            } catch (err) {
                console.error("Error creating customer lead:", err)
            }

            // Call the callback if provided
            if (onWorkOrderCreated) {
                onWorkOrderCreated()
            }
        } catch (err: any) {
            console.error("Error creating work order:", err)
            toast.error("Error creating work order: " + err.message)
        } finally {
            setIsSubmitting(false) // Reset submission state
            setIsWorkOrderFormOpen(false)
        }
    }

    return (
        <>
            <Button 
                className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 sm:px-7 py-1.5 text-xs sm:text-sm"
                onClick={() => setIsWorkOrderFormOpen(true)}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Creating...
                    </div>
                ) : (
                    <>
                        <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Create Work Order
                    </>
                )}
            </Button>

            {isWorkOrderFormOpen && (
                <WorkOrderForm
                    onClose={() => !isSubmitting && setIsWorkOrderFormOpen(false)}
                    onSave={handleSaveWorkOrder}
                    onAddTask={() => {}}
                />
            )}
        </>
    )
} 