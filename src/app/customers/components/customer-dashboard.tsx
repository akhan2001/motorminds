import { CustomerTable } from "./customer-table";
import { OrganizationCustomerTable } from "./organization-customer-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { CustomerForm } from "./customer-form";

export function CustomerDashboard({ shopId, user }: { shopId: string, user: any }) {
    const [isAdding, setIsAdding] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [useOrganizationTable, setUseOrganizationTable] = useState(false);

    // Check if user has organization access (simple check)
    useEffect(() => {
        const checkOrganizationAccess = async () => {
            if (!user?.id) return;
            
            try {
                // Simple API call to check if user can access organization customers
                const res = await fetch('/api/customers/organization-check');
                if (res.ok) {
                    const data = await res.json();
                    setUseOrganizationTable(data.hasOrganizationAccess);
                }
            } catch (error) {
                // If check fails, default to regular table (safe fallback)
                setUseOrganizationTable(false);
            }
        };
        
        checkOrganizationAccess();
    }, [user?.id]);

    const handleCustomerAdded = () => {
        setIsAdding(false);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">Customers</h1>
                        <p className="text-muted-foreground">
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
                
                {/* Use OrganizationCustomerTable for MSO shops, regular CustomerTable for individual shops */}
                {useOrganizationTable ? (
                    <OrganizationCustomerTable
                        shopId={shopId}
                        user={user}
                        key={refreshKey}
                        refreshIndex={refreshKey}
                    />
                ) : (
                    <CustomerTable
                        shopId={shopId}
                        user={user}
                        key={refreshKey}
                        refreshIndex={refreshKey}
                    />
                )}

                {/* Add Customer Form */}
                {isAdding && (
                    <CustomerForm 
                        onClose={handleCustomerAdded} 
                        shopId={shopId} 
                        isOpen={isAdding} 
                    />
                )}
            </div>
        </main>
    )
}
