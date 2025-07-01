import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get("shop_id")

    if (!shopId) {
      return NextResponse.json({ error: "Missing shop_id parameter" }, { status: 400 })
    }

    // Fetch all unpaid invoices for the given shop, ordered by date
    const { data: unpaidInvoices, error: invoiceError } = await supabase
      .from("invoices")
      .select("invoice_number, client_name, amount, issue_date, display_id")
      .eq("shop_id", shopId)
      .eq("status", "UNPAID")
      .order("issue_date", { ascending: true })

    if (invoiceError) {
      console.error("Error fetching unpaid invoices:", invoiceError)
      throw invoiceError
    }

    let totalAR = 0
    const agingBuckets = {
      current: { total: 0, invoices: [] as any[] }, // 0-30 days
      thirtyOneToSixty: { total: 0, invoices: [] as any[] }, // 31-60 days
      sixtyOneToNinety: { total: 0, invoices: [] as any[] }, // 61-90 days
      ninetyPlus: { total: 0, invoices: [] as any[] }, // 90+ days
    }
    const today = new Date()

    unpaidInvoices.forEach(invoice => {
      totalAR += invoice.amount
      const issueDate = new Date(invoice.issue_date)
      const daysOverdue = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 3600 * 24))

      if (daysOverdue <= 30) {
        agingBuckets.current.total += invoice.amount
        agingBuckets.current.invoices.push(invoice)
      } else if (daysOverdue <= 60) {
        agingBuckets.thirtyOneToSixty.total += invoice.amount
        agingBuckets.thirtyOneToSixty.invoices.push(invoice)
      } else if (daysOverdue <= 90) {
        agingBuckets.sixtyOneToNinety.total += invoice.amount
        agingBuckets.sixtyOneToNinety.invoices.push(invoice)
      } else {
        agingBuckets.ninetyPlus.total += invoice.amount
        agingBuckets.ninetyPlus.invoices.push(invoice)
      }
    })

    return NextResponse.json({
      totalAR,
      agingBuckets,
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 