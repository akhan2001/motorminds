import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
	try {
		const supabase = await createClient()
		const { searchParams } = new URL(req.url)
		const shopId = searchParams.get("shop_id")

		if (!shopId) {
			return NextResponse.json({ error: "Missing shop_id parameter" }, { status: 400 })
		}

		// Fetch all non-paid invoices for the given shop using invoices_table
		// Include invoices that have outstanding balance > 0 and status != 'paid'
		const { data: unpaidInvoices, error: invoiceError } = await supabase
			.from("invoices_table")
			.select(`
        id,
        invoice_number,
        display_id,
        total_amount,
        amount_paid,
        outstanding_balance,
        issue_date,
        due_date,
        status,
        customer:customers(id, customer_name, customer_email, customer_phone),
        customer_type,
        walk_in_vehicle_info
      `)
			.eq("shop_id", shopId)
			.neq("status", "paid") // Exclude only "paid" status - include all other statuses
			.or("archived.eq.false,archived.is.null")
			.gt("outstanding_balance", 0)
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

		unpaidInvoices?.forEach(invoice => {
			// Use outstanding_balance for accurate AR tracking (handles partial payments)
			const outstandingAmount = Number(invoice.outstanding_balance) || Number(invoice.total_amount) || 0
			totalAR += outstandingAmount

			const issueDate = new Date(invoice.issue_date)
			const daysOverdue = Math.floor((today.getTime() - issueDate.getTime()) / (1000 * 3600 * 24))

			// Get customer name - handle both registered and walk-in customers
			let clientName = 'Unknown Customer'
			if (invoice.customer?.customer_name) {
				clientName = invoice.customer.customer_name
			} else if (invoice.customer_type === 'walk_in' && invoice.walk_in_vehicle_info) {
				const vehicleInfo = invoice.walk_in_vehicle_info as any
				clientName = `Walk-in: ${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim()
			}

			const invoiceData = {
				id: invoice.id,
				invoice_number: invoice.invoice_number,
				display_id: invoice.display_id,
				client_name: clientName,
				amount: outstandingAmount,
				total_amount: Number(invoice.total_amount) || 0,
				amount_paid: Number(invoice.amount_paid) || 0,
				outstanding_balance: outstandingAmount,
				issue_date: invoice.issue_date,
				due_date: invoice.due_date,
				status: invoice.status,
				days_overdue: daysOverdue,
				customer: invoice.customer
			}

			if (daysOverdue <= 30) {
				agingBuckets.current.total += outstandingAmount
				agingBuckets.current.invoices.push(invoiceData)
			} else if (daysOverdue <= 60) {
				agingBuckets.thirtyOneToSixty.total += outstandingAmount
				agingBuckets.thirtyOneToSixty.invoices.push(invoiceData)
			} else if (daysOverdue <= 90) {
				agingBuckets.sixtyOneToNinety.total += outstandingAmount
				agingBuckets.sixtyOneToNinety.invoices.push(invoiceData)
			} else {
				agingBuckets.ninetyPlus.total += outstandingAmount
				agingBuckets.ninetyPlus.invoices.push(invoiceData)
			}
		})

		return NextResponse.json({
			totalAR,
			agingBuckets,
			invoiceCount: unpaidInvoices?.length || 0,
			// Summary stats
			stats: {
				totalOutstanding: totalAR,
				currentCount: agingBuckets.current.invoices.length,
				overdueCount: agingBuckets.thirtyOneToSixty.invoices.length +
					agingBuckets.sixtyOneToNinety.invoices.length +
					agingBuckets.ninetyPlus.invoices.length,
				criticalCount: agingBuckets.ninetyPlus.invoices.length,
			}
		})

	} catch (error: any) {
		console.error("[LIQUIDITY_GET_ERROR]", error)
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
}
