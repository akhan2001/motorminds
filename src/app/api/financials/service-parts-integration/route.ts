import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Types for service parts integration
interface ServiceUsage {
  service_id: string;
  work_order_id: string;
  quantity_used: number;
  cost_per_unit: number;
  total_cost: number;
  usage_date: string;
}

interface InventoryUpdate {
  service_id: string;
  quantity_change: number; // negative for usage, positive for restocking
  reason: string;
  work_order_id?: string;
}

// Function to record service/parts usage in work orders
async function recordServiceUsage(serviceUsage: ServiceUsage, shop_id: string) {
  const { data, error } = await supabase
    .from("service_usage")
    .insert({
      shop_id,
      service_id: serviceUsage.service_id,
      work_order_id: serviceUsage.work_order_id,
      quantity_used: serviceUsage.quantity_used,
      cost_per_unit: serviceUsage.cost_per_unit,
      total_cost: serviceUsage.total_cost,
      usage_date: serviceUsage.usage_date
    })
    .select();

  if (error) throw error;
  return data;
}

// Function to update inventory quantities
async function updateServiceInventory(inventoryUpdate: InventoryUpdate, shop_id: string) {
  // First, get current service data
  const { data: service, error: serviceError } = await supabase
    .from("shop_services")
    .select("*")
    .eq("id", inventoryUpdate.service_id)
    .eq("shop_id", shop_id)
    .single();

  if (serviceError || !service) {
    throw new Error("Service not found");
  }

  // Update quantity for parts (labor services don't have inventory)
  if (service.type === "parts") {
    const newQuantity = Math.max(0, (service.quantity || 0) + inventoryUpdate.quantity_change);
    
    const { data, error } = await supabase
      .from("shop_services")
      .update({ quantity: newQuantity })
      .eq("id", inventoryUpdate.service_id)
      .eq("shop_id", shop_id)
      .select();

    if (error) throw error;

    // Record inventory movement
    await supabase
      .from("inventory_movements")
      .insert({
        shop_id,
        service_id: inventoryUpdate.service_id,
        quantity_change: inventoryUpdate.quantity_change,
        reason: inventoryUpdate.reason,
        work_order_id: inventoryUpdate.work_order_id,
        previous_quantity: service.quantity || 0,
        new_quantity: newQuantity,
        movement_date: new Date().toISOString()
      });

    return data;
  }

  return service;
}

// Function to create cost entries for parts usage
async function createPartsUsageCost(serviceUsage: ServiceUsage, shop_id: string) {
  // Only create cost entries for parts, not labor
  const { data: service } = await supabase
    .from("shop_services")
    .select("type, service_name")
    .eq("id", serviceUsage.service_id)
    .single();

  if (service?.type === "parts") {
    const { data, error } = await supabase
      .from("cost")
      .insert({
        shop_id,
        date: serviceUsage.usage_date.split('T')[0],
        amount: serviceUsage.total_cost,
        type: "inventory",
        notes: `Parts usage: ${service.service_name} (${serviceUsage.quantity_used} units) - Work Order ${serviceUsage.work_order_id}`,
        work_order_id: serviceUsage.work_order_id
      })
      .select();

    if (error) throw error;
    return data;
  }

  return null;
}

// POST endpoint to record service/parts usage in work orders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop_id, work_order_id, services_used } = body;

    if (!shop_id || !work_order_id || !services_used || !Array.isArray(services_used)) {
      return NextResponse.json(
        { error: "Missing required fields: shop_id, work_order_id, services_used" },
        { status: 400 }
      );
    }

    const results: {
      service_usage: any[];
      inventory_updates: any[];
      cost_entries: any[];
    } = {
      service_usage: [],
      inventory_updates: [],
      cost_entries: []
    };

    // Process each service used
    for (const serviceUsed of services_used) {
      const { service_id, quantity_used } = serviceUsed;

      if (!service_id || !quantity_used || quantity_used <= 0) {
        continue; // Skip invalid entries
      }

      // Get service details
      const { data: service, error: serviceError } = await supabase
        .from("shop_services")
        .select("*")
        .eq("id", service_id)
        .eq("shop_id", shop_id)
        .single();

      if (serviceError || !service) {
        console.error(`Service ${service_id} not found`);
        continue;
      }

      const serviceUsage: ServiceUsage = {
        service_id,
        work_order_id,
        quantity_used,
        cost_per_unit: service.price,
        total_cost: service.price * quantity_used,
        usage_date: new Date().toISOString()
      };

      // Record service usage
      const usageData = await recordServiceUsage(serviceUsage, shop_id);
      results.service_usage.push(usageData);

      // Update inventory for parts
      if (service.type === "parts") {
        const inventoryUpdate: InventoryUpdate = {
          service_id,
          quantity_change: -quantity_used, // Negative because it's usage
          reason: `Used in work order ${work_order_id}`,
          work_order_id
        };

        const inventoryData = await updateServiceInventory(inventoryUpdate, shop_id);
        results.inventory_updates.push(inventoryData);

        // Create cost entry for parts usage
        const costData = await createPartsUsageCost(serviceUsage, shop_id);
        if (costData) {
          results.cost_entries.push(costData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Services usage recorded successfully",
      data: results
    });

  } catch (error: any) {
    console.error("Error in service parts integration:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve service usage for a work order
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const work_order_id = searchParams.get("work_order_id");
    const shop_id = searchParams.get("shop_id");

    if (!work_order_id || !shop_id) {
      return NextResponse.json(
        { error: "Missing work_order_id or shop_id" },
        { status: 400 }
      );
    }

    // Get service usage for the work order
    const { data: serviceUsage, error: usageError } = await supabase
      .from("service_usage")
      .select(`
        *,
        shop_services (
          service_name,
          description,
          type,
          price
        )
      `)
      .eq("work_order_id", work_order_id)
      .eq("shop_id", shop_id);

    if (usageError) throw usageError;

    // Get inventory movements for the work order
    const { data: inventoryMovements, error: movementError } = await supabase
      .from("inventory_movements")
      .select(`
        *,
        shop_services (
          service_name,
          type
        )
      `)
      .eq("work_order_id", work_order_id)
      .eq("shop_id", shop_id);

    if (movementError) throw movementError;

    // Calculate totals
    const totalLabor = serviceUsage
      ?.filter(usage => usage.shop_services?.type === "labor")
      .reduce((sum, usage) => sum + usage.total_cost, 0) || 0;

    const totalParts = serviceUsage
      ?.filter(usage => usage.shop_services?.type === "parts")
      .reduce((sum, usage) => sum + usage.total_cost, 0) || 0;

    return NextResponse.json({
      service_usage: serviceUsage || [],
      inventory_movements: inventoryMovements || [],
      totals: {
        labor: totalLabor,
        parts: totalParts,
        total: totalLabor + totalParts
      }
    });

  } catch (error: any) {
    console.error("Error retrieving service usage:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT endpoint to restock parts inventory
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop_id, service_id, quantity_added, cost_per_unit } = body;

    if (!shop_id || !service_id || !quantity_added || quantity_added <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: shop_id, service_id, quantity_added" },
        { status: 400 }
      );
    }

    const inventoryUpdate: InventoryUpdate = {
      service_id,
      quantity_change: quantity_added, // Positive for restocking
      reason: "Inventory restock"
    };

    const updatedService = await updateServiceInventory(inventoryUpdate, shop_id);

    // Create cost entry for inventory purchase if cost provided
    if (cost_per_unit && cost_per_unit > 0) {
      const totalCost = quantity_added * cost_per_unit;
      
      await supabase
        .from("cost")
        .insert({
          shop_id,
          date: new Date().toISOString().split('T')[0],
          amount: totalCost,
          type: "inventory",
          notes: `Inventory restock: ${quantity_added} units at $${cost_per_unit} each`
        });
    }

    return NextResponse.json({
      success: true,
      message: "Inventory restocked successfully",
      data: updatedService
    });

  } catch (error: any) {
    console.error("Error restocking inventory:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
} 