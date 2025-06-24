import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const shopId = searchParams.get("shop_id")
    if (!shopId) {
      return NextResponse.json({ error: "Missing shop_id" }, { status: 400 })
    }

    // Fetch all active employees for the shop
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("salary_or_wage, pay_frequency")
      .eq("shop_id", shopId)
      .is("termination_date", null) // Only active employees

    if (employeesError) throw employeesError

    // Calculate total monthly payroll
    // This is a simplified calculation. A real-world scenario would be more complex.
    let totalMonthlyPayroll = 0
    employees.forEach(emp => {
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

    const numberOfEmployees = employees.length

    return NextResponse.json({
      totalMonthlyPayroll,
      numberOfEmployees,
      employees,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 