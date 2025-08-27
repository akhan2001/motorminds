import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shop_id");
    const period = searchParams.get("period") || "month"; // day | month | year
    const span = parseInt(searchParams.get("span") || "12", 10); // number of periods

    if (!shopId) {
      return NextResponse.json({ error: "Missing shop_id" }, { status: 400 });
    }

    // Calculate start date based on span and period
    const now = new Date();
    let startDate = new Date(now);
    if (period === "day") {
      startDate.setDate(startDate.getDate() - span);
    } else if (period === "year") {
      startDate.setFullYear(startDate.getFullYear() - span);
    } else {
      startDate.setMonth(startDate.getMonth() - span);
    }

    const periodTrunc = period === "day" ? "day" : period === "year" ? "year" : "month";

    // Perform aggregation
    const { data, error } = await supabase.rpc("revenue_trend", {
      p_shop_id: shopId,
      p_start_date: startDate.toISOString(),
      p_end_date: now.toISOString(),
      p_granularity: periodTrunc,
    });

    // If the RPC is not created yet, fallback to query via JS
    if (error || !data) {
      const { data: rows, error: qErr } = await supabase
        .from("invoices")
        .select("period:issue_date, amount, parts_total_price, labour_total_price")
        .eq("shop_id", shopId)
        .eq("status", "PAID")
        .gte("issue_date", startDate.toISOString())
        .lte("issue_date", now.toISOString());

      if (qErr) throw qErr;

      // Aggregate in JS
      const map: Record<string, { revenue: number; cogs: number }> = {};
      rows.forEach((row: any) => {
        const date = new Date(row.period);
        let key: string;
        if (periodTrunc === "day") {
          key = date.toISOString().slice(0, 10);
        } else if (periodTrunc === "year") {
          key = date.getFullYear().toString();
        } else {
          key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`; // yyyy-mm
        }
        if (!map[key]) {
          map[key] = { revenue: 0, cogs: 0 };
        }
        map[key].revenue += row.amount || 0;
        map[key].cogs += (row.parts_total_price || 0) + (row.labour_total_price || 0);
      });

      const trend = Object.keys(map)
        .sort()
        .map((key) => ({ period: key, ...map[key] }));

      return NextResponse.json(trend);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 