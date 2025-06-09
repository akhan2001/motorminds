"use client"

import { VehicleTable } from "./VehicleTable";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { VehicleForm } from "./VehicleForm";
import { verifyCustomerBelongsToShop } from "../../api/customer-utils";
import { toast } from "sonner";

interface CustomerVehicleDashboardProps {
    shopId: string;
    user: any;
    customerId: string;
}

export function CustomerVehicleDashboard({ shopId, user, customerId }: CustomerVehicleDashboardProps) {
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        async function verifyAccess() {
            try {
                const customerData = await verifyCustomerBelongsToShop(customerId, shopId);
                setIsVerified(true);
            } catch (error) {
                console.error('Error verifying customer access:', error);
                toast.error("You don't have access to this customer's vehicles");
                setIsVerified(false);
            } finally {
                setIsLoading(false);
            }
        }

        verifyAccess();
    }, [customerId, shopId]);

    const handleVehicleAdded = () => {
        setIsAdding(false);
        setRefreshKey(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="flex justify-center items-center p-8">
                <p className="text-gray-400">Access denied. This customer does not belong to your shop.</p>
            </div>
        );
    }

    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-row justify-between items-center mb-10">
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Vehicles</h1>
                        <p className="text-gray-400">
                            Manage your customer vehicles and track their service history. Add new vehicles, update information, and view maintenance records.
                        </p>
                    </div>
                    <div className="flex flex-row gap-4">
                        <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full px-7" onClick={() => setIsAdding(true)}>
                            <PlusIcon className="w-4 h-4 mr-1" />
                            ADD VEHICLE
                        </Button>
                    </div>
                </div>
                <VehicleTable
                    shopId={shopId}
                    key={refreshKey}
                    refreshIndex={refreshKey}
                />
                {isAdding && <VehicleForm onClose={handleVehicleAdded} shopId={shopId} isOpen={isAdding} />}
            </div>
        </main>
    );
}
