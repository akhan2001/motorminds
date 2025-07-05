import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shop_id, period_start_date, period_end_date } = body;
    if (!shop_id || !period_start_date || !period_end_date) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Compute revenue & cogs
    const { data: invoices, error: invErr } = await supabase
      .from("invoices")
      .select("amount, parts_cost, labour_cost, parts_items, labour_items")
      .eq("shop_id", shop_id)
      .eq("status", "PAID")
      .gte("paid_at", period_start_date)
      .lte("paid_at", period_end_date);

    if (invErr) throw invErr;

    let totalRevenue = 0,
      totalCogs = 0,
      totalPartsRevenue = 0,
      totalLaborRevenue = 0;
      
    invoices.forEach((inv) => {
      totalRevenue += inv.amount || 0;
      totalCogs += (inv.parts_cost || 0) + (inv.labour_cost || 0);

      // Calculate parts revenue from JSON
      if (Array.isArray(inv.parts_items)) {
        inv.parts_items.forEach((item: any) => {
          totalPartsRevenue += item.cost || 0;
        });
      }

      // Calculate labor revenue from JSON
      if (Array.isArray(inv.labour_items)) {
        inv.labour_items.forEach((item: any) => {
          totalLaborRevenue += item.cost || 0;
        });
      }
    });

    // Fixed costs over range (reuse logic)
    const { data: fixed } = await supabase
      .from("fixed_costs")
      .select("amount, frequency")
      .eq("shop_id", shop_id);

    const { data: staff } = await supabase
      .from("shop_staff")
      .select("id, salary_or_wage, pay_frequency")
      .eq("shop_id", shop_id)
      .is("termination_date", null);

    const days =
      (new Date(period_end_date).getTime() - new Date(period_start_date).getTime()) /
        (1000 * 60 * 60 * 24) +
      1;
    const perDay = (amt: number, freq: string) => {
      switch (freq) {
        case "daily":
          return amt;
        case "weekly":
          return amt / 7;
        case "monthly":
          return amt / 30;
        case "quarterly":
          return amt / 90;
        case "yearly":
          return amt / 365;
        default:
          return 0;
      }
    };
    const totalFixedCosts = fixed?.reduce((s, c) => s + perDay(c.amount, c.frequency) * days, 0) || 0;

    const gross_profit = totalRevenue - totalCogs;
    const net_profit = gross_profit - totalFixedCosts;

    // Upsert into financial_statements
    await supabase.from("financial_statements").upsert({
      shop_id,
      statement_type: "Monthly Summary",
      period_start_date,
      period_end_date,
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      total_parts_revenue: totalPartsRevenue,
      total_labor_revenue: totalLaborRevenue,
      total_fixed_costs: totalFixedCosts,
      gross_profit,
      net_profit,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const shop_id = searchParams.get("shop_id");
        if (!shop_id) {
            return NextResponse.json({ error: "Missing shop_id" }, { status: 400 });
        }

        const { data: statements, error } = await supabase
            .from("financial_statements")
            .select("*")
            .eq("shop_id", shop_id)
            .order("period_start_date", { ascending: false });

        if (error) throw error;

        return NextResponse.json(statements);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
} 