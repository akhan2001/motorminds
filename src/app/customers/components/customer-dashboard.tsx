import { CustomerTable } from "./customer-table";
import { OrganizationCustomerTable } from "./organization-customer-table";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { CustomerForm } from "./customer-form";
import { useRouter } from "next/navigation";
import { OrganizationCustomersService } from "../lib/organization-customers-service";
import { shouldEnableOrganizationWideSearch } from "@/lib/utils/organization-utils";

export function CustomerDashboard({ shopId, user }: { shopId: string, user: any }) {
    const [isAdding, setIsAdding] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [useOrganizationTable, setUseOrganizationTable] = useState(false);
    const router = useRouter();

    // Check if organization-wide features should be enabled
    useEffect(() => {
        const checkOrganizationFeatures = async () => {
            if (user?.id) {
                const status = await OrganizationCustomersService.getOrganizationStatus(user.id);
                const shouldUseOrgTable = shouldEnableOrganizationWideSearch(status.adminType, status.organizationId);
                setUseOrganizationTable(shouldUseOrgTable);
            }
        };
        checkOrganizationFeatures();
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
                {isAdding && <CustomerForm onClose={handleCustomerAdded} shopId={shopId} isOpen={isAdding} />}
            </div>
        </main>
    )
}
