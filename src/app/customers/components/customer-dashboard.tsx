import { InfoHoverCard } from "@/app/components/InfoHoverCard";
import { CustomerFilter } from "./customer-filter";
import { CustomerTable } from "./customer-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useMemo } from "react";
import { supabase } from "@/lib/supabase";

export function CustomerDashboard() {

    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Customers
                            <InfoHoverCard text="Welcome to the customers page. Here you can see all of your customers and their information." />
                        </h1>
                        <p className="text-gray-400">
                            Manage your customer base and track their activity. Add new customers, edit their information, and view their activity.
                            </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-7">
                            <PlusIcon className="w-4 h-4 mr-1" />
                            ADD CUSTOMER
                        </Button>
                    </div>
                </div>
                <CustomerFilter />
                <h2 className="text-xl font-semibold mb-4">Customers</h2>
                <CustomerTable />
            </div>
        </main> 
    )
}
