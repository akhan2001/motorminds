"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAllContracts, fetchShopDetails, createContract, updateContract, deleteContract } from "../utils/contract-utils";
import { PlusIcon, Search, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ContractCard from "./ContractCard";
import ContractEditor from "./contract-editor";
import ShopInfoCheck from "./ShopInfoCheck";

export default function ContractsDashboard({ shopId }: { shopId: string; }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [contracts, setContracts] = useState<any[]>([]);
    const [shop, setShop] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    
    const searchQuery = searchParams ? searchParams.get("q") || "" : "";
    const sortOrder = searchParams ? searchParams.get("sort") || "desc" : "desc";

    const refreshContracts = async () => {
        if (!shopId) return;
        setIsLoading(true);
        try {
            const [contractsData, shopData] = await Promise.all([
                fetchAllContracts(shopId),
                fetchShopDetails(shopId),
            ]);
            setContracts(contractsData || []);
            setShop(shopData);
        } catch (error) {
            console.error("Error refreshing data:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        refreshContracts();
    }, [shopId, searchParams]);

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        router.replace(`/customer-contracts?${params.toString()}`);
    };

    const handleSort = () => {
        const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("sort", newSortOrder);
        router.replace(`/customer-contracts?${params.toString()}`);
    };

    const handleSave = async (contractData: any) => {
        try {
            if (contractData.id) {
                await updateContract(contractData.id, contractData);
            } else {
                await createContract({ ...contractData, shop_id: shopId });
            }
        } finally {
            await refreshContracts();
            setIsEditorOpen(false);
        }
    };

    const handleDelete = async (contractId: string) => {
        if (window.confirm("Are you sure you want to delete this contract?")) {
            await deleteContract(contractId);
            await refreshContracts();
        }
    };

    const openEditorForNew = () => {
        setSelectedContract(null);
        setIsEditorOpen(true);
    };

    const openEditorForEdit = (contract: any) => {
        setSelectedContract(contract);
        setIsEditorOpen(true);
    };

    const sortedContracts = useMemo(() => {
        return [...contracts]
            .filter(contract => {
                const query = searchQuery.toLowerCase();
                return (
                    contract.title?.toLowerCase().includes(query) ||
                    contract.customer?.customer_name?.toLowerCase().includes(query) ||
                    contract.customer?.customer_email?.toLowerCase().includes(query) ||
                    contract.vehicle_make?.toLowerCase().includes(query) ||
                    contract.vehicle_model?.toLowerCase().includes(query)
                );
            })
            .sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
    }, [contracts, searchQuery, sortOrder]);

    if (isLoading) {
        return (
            <div className="flex flex-1 justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Service Contracts</h1>
                    <p className="text-gray-400">Manage all your customer service contracts.</p>
                </div>
                <Button
                    onClick={openEditorForNew}
                    disabled={!shop?.shop_name || !shop?.shop_address}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Contract
                </Button>
            </div>
            
            <ShopInfoCheck shop={shop} />

            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div className="relative w-full md:w-auto flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Search by title, customer, vehicle..."
                        className="pl-8 w-full md:w-[300px] bg-zinc-900 border-zinc-800 text-white"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="text-gray-300 border-gray-600 hover:bg-gray-700"
                        onClick={handleSort}
                    >
                        Sort by Date
                        <ArrowUpDown className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedContracts.map((contract) => (
                    <ContractCard
                        key={contract.id}
                        contract={contract}
                        onEdit={() => openEditorForEdit(contract)}
                        onDelete={() => handleDelete(contract.id)}
                    />
                ))}
            </div>

            {sortedContracts.length === 0 && !isLoading && (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-lg">No contracts found.</p>
                    <p className="text-sm">Click "New Contract" to get started.</p>
                </div>
            )}

            <ContractEditor
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSave}
                contract={selectedContract}
                shopId={shopId}
            />
        </main>
    );
} 