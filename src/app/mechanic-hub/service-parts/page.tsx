"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/app/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { useServices } from "./hooks/useServices";
import { ServicePartsHeader } from "./components/ServicePartsHeader";
import { ServicePartsTable } from "./components/ServicePartsTable";
import { EditServiceDialog } from "./components/EditServiceDialog";
import { checkUser } from "@/utils/supabase/supabase-auth";
import { getShopId } from "@/utils/supabase/supabase-shop";
import { Service } from "./types";

export default function ServicePartsPage() {
    const router = useRouter();
    const [shopId, setShopId] = useState<string | null>(null);
    const { services, setServices, isLoading, fetchServices, addService, updateService, deleteService } = useServices(shopId);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [filteredServices, setFilteredServices] = useState<Service[]>([]);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [newService, setNewService] = useState<Partial<Service>>({
        service_name: "",
        description: "",
        price: 0,
        cost: 0,
        quantity: 1,
        type: "labor",
    });

    useEffect(() => {
        const getUserShop = async () => {
            const user = await checkUser();
            if (user) {
                const id = await getShopId(user.id);
                setShopId(id);
            } else {
                router.push('/login');
            }
        };
        getUserShop();
    }, [router]);

    useEffect(() => {
        let filtered = services;
        if (activeTab !== "all") {
            filtered = filtered.filter(service => service.type === activeTab);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                service =>
                    service.service_name.toLowerCase().includes(query) ||
                    (service.description && service.description.toLowerCase().includes(query))
            );
        }
        setFilteredServices(filtered);
    }, [searchQuery, activeTab, services]);

    const handleAddService = async () => {
        const result = await addService({
            ...newService,
            cost: newService.type === "parts" ? (newService.cost || 0) : null,
        });
        if (result) {
            setIsAddDialogOpen(false);
            resetForm();
        }
    };

    const handleUpdateService = async (id: string, updates: Partial<Service>) => {
        const result = await updateService(id, updates);
        if (result) {
            setIsEditDialogOpen(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        if (confirm("Are you sure you want to delete this service?")) {
            await deleteService(id);
        }
    };

    const handleEditClick = (service: Service) => {
        setCurrentService(service);
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setNewService({
            service_name: "",
            description: "",
            price: 0,
            cost: 0,
            quantity: 1,
            type: "labor",
        });
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-[#0A0A0A] text-white">
            <Nav />
            <main className="flex-1 p-6">
                <ServicePartsHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onRefresh={() => shopId && fetchServices()}
                    isAddDialogOpen={isAddDialogOpen}
                    onAddDialogChange={setIsAddDialogOpen}
                    newServiceData={newService}
                    onNewServiceChange={(changes) => setNewService(prev => ({ ...prev, ...changes }))}
                    onAddService={handleAddService}
                />

                <Card className="mt-6 bg-[#0F0F0F] border-[#222]">
                    <CardContent className="p-4">
                        <ServicePartsTable
                            services={filteredServices}
                            isLoading={isLoading}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteService}
                        />
                    </CardContent>
                </Card>

                <EditServiceDialog
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    service={currentService}
                    onSubmit={handleUpdateService}
                />
            </main>
        </div>
    );
}