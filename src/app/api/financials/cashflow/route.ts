import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get("shop_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    if (!shopId || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // 1. Fetch data from paid invoices in the date range
    const { data: paidInvoices, error: invoiceError } = await supabase
      .from("invoices")
      .select("amount, parts_total_price, labour_total_price")
      .eq("shop_id", shopId)
      .eq("status", "PAID")
      .gte("issue_date", startDate)
      .lte("issue_date", endDate)

    if (invoiceError) throw invoiceError

    let totalRevenue = 0
    let totalCogs = 0

    paidInvoices.forEach(inv => {
      totalRevenue += inv.amount || 0
      totalCogs += (inv.parts_total_price || 0) + (inv.labour_total_price || 0)
    })

    // 2. Fetch Fixed Costs from the new 'fixed_costs' table
    const { data: fixedCostsData, error: fixedCostsError } = await supabase
      .from("fixed_costs")
      .select("amount, frequency")
      .eq("shop_id", shopId)
    
    if (fixedCostsError) throw fixedCostsError

    // Prorate fixed costs based on frequency and number of days in range
    const rangeDays =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) +
      1

    const dailyEquivalent = (amount: number, frequency: string) => {
      switch (frequency) {
        case "daily":
          return amount
        case "weekly":
          return amount / 7
        case "monthly":
          return amount / 30
        case "quarterly":
          return amount / 90
        case "yearly":
          return amount / 365
        default:
          return 0
      }
    }

    const totalFixedCosts = fixedCostsData.reduce((sum, cost) => {
      return sum + dailyEquivalent(cost.amount, cost.frequency) * rangeDays
    }, 0)

    // 3. Fetch Payroll Costs for active employees
    const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("salary_or_wage, pay_frequency")
        .eq("shop_id", shopId)
        .is("termination_date", null)

    if (employeesError) throw employeesError

    const totalPayrollCosts = employees.reduce((sum, emp) => {
        const salary = emp.salary_or_wage || 0;
        let employeeCost = 0;
        if (emp.pay_frequency === 'hourly') {
            // Assuming 8 hours/day for the given range. This is a simplification.
            employeeCost = salary * 8 * rangeDays;
        } else {
            // Re-use dailyEquivalent for weekly, monthly, etc. salaries
            employeeCost = dailyEquivalent(salary, emp.pay_frequency) * rangeDays;
        }
        return sum + employeeCost;
    }, 0);

    // 4. Calculate Net Cashflow
    const netCashflow = totalRevenue - totalCogs - totalFixedCosts - totalPayrollCosts

    return NextResponse.json({
      totalRevenue,
      totalCogs,
      totalFixedCosts,
      totalPayrollCosts,
      netCashflow,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 