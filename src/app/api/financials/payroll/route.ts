import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get("shop_id")
    if (!shopId) {
      return NextResponse.json({ error: "Missing shop_id" }, { status: 400 })
    }

    // 1. Fetch all active employees for the shop
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, salary_or_wage, pay_frequency")
      .eq("shop_id", shopId)
      .is("termination_date", null) // Only active employees

    if (employeesError) throw employeesError

    // Manually add a full_name property for the frontend
    const employeesWithFullName = employees.map(e => ({
        ...e,
        full_name: `${e.first_name || ''} ${e.last_name || ''}`.trim()
    }));

    // 2. Calculate total monthly payroll
    let totalMonthlyPayroll = 0
    employeesWithFullName.forEach(emp => {
      const salary = emp.salary_or_wage || 0
      switch (emp.pay_frequency) {
        case "hourly":
          // Assumption: 40 hours/week, 4.33 weeks/month
          totalMonthlyPayroll += salary * 40 * 4.33
          break
        case "weekly":
          totalMonthlyPayroll += salary * 4.33
          break
        case "bi-weekly":
          totalMonthlyPayroll += salary * 2.165 // (52 weeks / 12 months) / 2
          break
        case "monthly":
          totalMonthlyPayroll += salary
          break
        default:
          break
      }
    })
    const numberOfEmployees = employeesWithFullName.length

    // 3. Fetch total revenue from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: revenueData, error: revenueError } = await supabase
        .from("invoices")
        .select("amount")
        .eq("shop_id", shopId)
        .eq("status", "PAID")
        .gte("issue_date", thirtyDaysAgo.toISOString())

    if(revenueError) throw revenueError

    const totalRevenue = revenueData.reduce((sum, inv) => sum + (inv.amount || 0), 0)

    // 4. Calculate revenue per employee
    const revenuePerEmployee = numberOfEmployees > 0 ? totalRevenue / numberOfEmployees : 0

    return NextResponse.json({
      totalMonthlyPayroll,
      numberOfEmployees,
      totalRevenue,
      revenuePerEmployee,
      employees: employeesWithFullName,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 