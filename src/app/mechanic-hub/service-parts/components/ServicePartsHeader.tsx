import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import { ServicePartsDialog } from "./service-parts-dialog";

interface ServicePartsHeaderProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onRefresh: () => void;
    isAddDialogOpen: boolean;
    onAddDialogChange: (open: boolean) => void;
    newServiceData: any;
    onNewServiceChange: (data: any) => void;
    onAddService: () => void;
}

export function ServicePartsHeader({
    searchQuery,
    onSearchChange,
    activeTab,
    onTabChange,
    onRefresh,
    isAddDialogOpen,
    onAddDialogChange,
    newServiceData,
    onNewServiceChange,
    onAddService,
}: ServicePartsHeaderProps) {
    return (
        <div>
            <header className="flex items-center justify-between pb-4 border-b border-[#222]">
                <h1 className="text-2xl font-bold">Manage Services & Parts</h1>
                <ServicePartsDialog
                    isOpen={isAddDialogOpen}
                    onOpenChange={onAddDialogChange}
                    formData={newServiceData}
                    onFormChange={onNewServiceChange}
                    onSubmit={onAddService}
                />
            </header>
            <div className="flex justify-between items-center mt-6">
                <Tabs value={activeTab} onValueChange={onTabChange}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="labor">Labor</TabsTrigger>
                        <TabsTrigger value="parts">Parts</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-64 bg-[#1A1A1A] border-[#333] focus:ring-0"
                    />
                    <Button variant="ghost" size="icon" onClick={onRefresh}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
} 