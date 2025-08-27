"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Nav } from "@/app/components/nav"
import { Button } from "@/components/ui/button"
import { FileText, PlusCircle } from "lucide-react"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { getShopId, getShopName } from "@/utils/supabase/supabase-shop"
import SummaryCard from "./components/SummaryCard"
import BreadcrumbNav from "./components/BreadcrumbNav"
import EmployeeCostTable from "./components/EmployeeCostTable"
import EditEmployeeModal from "./components/EditEmployeeModal"
import { deactivateEmployee } from "./utils/employee-management"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AddEmployeeForm from "@/app/settings/components/AddEmployeeForm"
import { generatePayrollReport, generatePayrollCsv } from "../utils/report-generator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PayrollData {
  totalMonthlyPayroll: number;
  numberOfEmployees: number;
  totalRevenue: number;
  revenuePerEmployee: number;
  employees: any[];
}

export default function PayrollPage() {
  const [data, setData] = useState<PayrollData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  const [shopName, setShopName] = useState<string>('Your Shop')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const router = useRouter()

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const fetchPayrollData = async () => {
    if (!shopId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/financials/payroll?shop_id=${shopId}`);
      if (!response.ok) throw new Error("Failed to fetch payroll data");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function getShop() {
      const user = await checkUser();
      if (user) {
        const id = await getShopId(user.id);
        if (id) {
            setShopId(id);
            const name = await getShopName(id);
            setShopName(name || 'Your Shop');
        }
        else router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
    getShop();
  }, [router]);

  useEffect(() => {
    fetchPayrollData();
  }, [shopId]);

  const handleOpenEditModal = (employee: any) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedEmployee(null);
    setEditModalOpen(false);
  };

  const handleDeactivate = async (employeeId: string) => {
    if (window.confirm("Are you sure you want to deactivate this employee? This action is reversible.")) {
        try {
            await deactivateEmployee(employeeId);
            fetchPayrollData(); // Refetch data to update the UI
        } catch (error) {
            console.error("Failed to deactivate employee", error);
            alert("An error occurred.")
        }
    }
  };

  const handleEmployeeUpdate = () => {
    fetchPayrollData();
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    if (!data) return;
    setIsGeneratingReport(true);
    try {
        if (format === 'pdf') {
            generatePayrollReport(data, shopName);
        } else {
            generatePayrollCsv(data.employees);
        }
    } catch(error) {
        console.error("Failed to generate report:", error);
        alert("An error occurred while generating the report.");
    } finally {
        setIsGeneratingReport(false);
    }
  };

  // Skeleton loader
  if (isLoading || !data) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white">
        <Nav activeLink="Financials" />
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-[#1a1a1a] rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-[#1a1a1a] rounded-xl"></div>
              ))}
            </div>
            <div className="h-96 bg-[#1a1a1a] rounded-xl"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Nav activeLink="Financials" />
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <BreadcrumbNav />

        {/* Header */}
        <div className="flex items-center justify-between my-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payroll Analytics</h1>
            <p className="text-gray-400">Analyze payroll costs and workforce efficiency.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setAddModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Employee
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button disabled={isGeneratingReport} className="bg-[#E53935] hover:bg-[#c62828] text-white">
                        <FileText className="w-4 h-4 mr-2" />
                        {isGeneratingReport ? 'Generating...' : 'Export Report'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#333] text-white">
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>Export Summary (PDF)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>Export Detail (CSV)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <SummaryCard title="Total Monthly Payroll" value={data.totalMonthlyPayroll} isCurrency={true} />
            <SummaryCard title="Active Employees" value={data.numberOfEmployees} />
            <SummaryCard title="Revenue (Last 30 Days)" value={data.totalRevenue} isCurrency={true} />
            <SummaryCard title="Revenue Per Employee" value={data.revenuePerEmployee} isCurrency={true} />
        </div>

        {/* Employees Table */}
        <EmployeeCostTable 
            employees={data.employees}
            onEdit={handleOpenEditModal}
            onDeactivate={handleDeactivate}
        />
      </main>

        <EditEmployeeModal
            employee={selectedEmployee}
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onUpdated={handleEmployeeUpdate}
        />

        <Dialog open={isAddModalOpen} onOpenChange={setAddModalOpen}>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                </DialogHeader>
                {shopId && (
                    <AddEmployeeForm 
                        shopId={shopId} 
                        onAdded={() => {
                            setAddModalOpen(false);
                            fetchPayrollData();
                        }} 
                    />
                )}
            </DialogContent>
        </Dialog>
    </div>
  )
}
