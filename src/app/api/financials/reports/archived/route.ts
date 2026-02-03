import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const startDateStr = searchParams.get("start_date");
    const endDateStr = searchParams.get("end_date");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    if (!shopId) {
        return NextResponse.json({ error: "shop_id is required" }, { status: 400 });
    }

    try {
        // Fetch archived work orders only
        let archivedWorkOrders: any[] = [];
        let workOrdersTotalCount = 0;
        try {
            // First, get total count for pagination
            let woCountQuery = supabase
                .from("work_orders")
                .select("id", { count: "exact", head: true })
                .eq("shop_id", shopId)
                .eq("archived", true);

            if (startDateStr && endDateStr) {
                woCountQuery = woCountQuery
                    .gte("updated_at", startDateStr)
                    .lte("updated_at", endDateStr);
            }

            const { count: woCount } = await woCountQuery;
            workOrdersTotalCount = woCount || 0;

            // Then fetch paginated data
            let workOrdersQuery = supabase
                .from("work_orders")
                .select(`
                    id,
                    title,
                    status,
                    created_at,
                    updated_at,
                    customer:customers(id, customer_name),
                    vehicle:customer_vehicles(id, year, make, model, license_plate)
                `)
                .eq("shop_id", shopId)
                .eq("archived", true)
                .order("updated_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (startDateStr && endDateStr) {
                workOrdersQuery = workOrdersQuery
                    .gte("updated_at", startDateStr)
                    .lte("updated_at", endDateStr);
            }

            const { data, error: workOrdersError } = await workOrdersQuery;

            if (workOrdersError) {
                console.error("Error fetching archived work orders:", workOrdersError);
                // Don't throw - continue without work orders data
            } else {
                archivedWorkOrders = data || [];
            }
        } catch (woErr) {
            console.error("Error in work orders query:", woErr);
            // Continue without work orders data
        }

        // Calculate total pages
        const workOrdersTotalPages = Math.ceil(workOrdersTotalCount / limit);

        return NextResponse.json({
            workOrders: archivedWorkOrders,
            summary: {
                workOrdersCount: archivedWorkOrders.length,
                workOrdersTotalCount,
            },
            pagination: {
                page,
                limit,
                totalPages: workOrdersTotalPages,
                hasMore: page < workOrdersTotalPages,
            }
        }, { status: 200 });

    } catch (err: any) {
        console.error("Error in archived report:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
