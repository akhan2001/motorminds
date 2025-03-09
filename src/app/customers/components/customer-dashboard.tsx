import { CustomerTable } from "./customer-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import CustomerForm from "./customer-form";

export function CustomerDashboard({ shopId, user }: { shopId: string, user: any }) {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Customers</h1>
                        <p className="text-gray-400">
                            Manage your customer base and track their activity. Add new customers, edit their information, and view their activity.
                        </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-7" onClick={() => setIsAdding(true)}>
                            <PlusIcon className="w-4 h-4 mr-1" />
                            ADD CUSTOMER
                        </Button>
                    </div>
                </div>
                <CustomerTable
                    shopId={shopId}
                    user={user}
                />
                {isAdding && <CustomerForm onClose={() => setIsAdding(false)} shopId={shopId} />}
            </div>
        </main>
    )
}
