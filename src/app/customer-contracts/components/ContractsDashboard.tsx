"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchAllContracts, fetchShopDetails, createContract, updateContract, deleteContract } from "../utils/contract-utils";
import { PlusIcon, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContractCard from "./ContractCard";
import ContractEditor from "./contract-editor";
import ShopInfoCheck from "./ShopInfoCheck";
import { pdf } from '@react-pdf/renderer';
import { ContractPDFTemplate } from './ContractPDFTemplate';
import { toast } from "sonner";
import { ContractPreviewDialog } from "./ContractPreviewDialog";
import { SendConfirmationDialog } from "./SendConfirmationDialog";
import { ContractStatusDashboard } from "./DocuSeal";

export default function ContractsDashboard({ shopId }: { shopId: string; }) {
    const router = useRouter();
    const [contracts, setContracts] = useState<any[]>([]);
    const [shop, setShop] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [contractToSend, setContractToSend] = useState<any>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const handleSendContract = async () => {
        if (!contractToSend) return;

        // Logic to check for email and shop details
        if (!contractToSend.customer_id) {
            toast.error("This contract is not associated with a customer.", {
                action: { label: "Edit Contract", onClick: () => openEditorForEdit(contractToSend) },
            });
            setContractToSend(null);
            return;
        }
        if (!contractToSend.customer?.customer_email) {
            toast.error("Customer does not have an email.", {
                action: { label: "Add Email", onClick: () => router.push(`/customers/${contractToSend.customer_id}`) },
            });
            setContractToSend(null);
            return;
        }
        if (!shop) {
            toast.error("Shop details not available.");
            setContractToSend(null);
            return;
        }

        try {
            toast.info("Preparing contract for sending...");
            const blob = await pdf(<ContractPDFTemplate contract={contractToSend} shop={shop} />).toBlob();
            
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1];
                
                const response = await fetch('/api/contracts/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer: contractToSend.customer,
                        shop: shop,
                        pdfBase64: base64data,
                        contractId: contractToSend.id
                    })
                });

                if (!response.ok) throw new Error("Failed to send email");

                toast.success("Contract sent successfully!");
            };

        } catch (error) {
            console.error("Error sending contract:", error);
            toast.error("Failed to send contract.");
        } finally {
            setContractToSend(null); // Close the dialog
        }
    };
    
    const handleOpenSendConfirmation = (contract: any) => {
        setContractToSend(contract);
    };

    const handleDownloadContractPDF = async (contract: any) => {
        if (!shop) {
            toast.error("Shop details not available to generate PDF.");
            return;
        }
        try {
            const blob = await pdf(<ContractPDFTemplate contract={contract} shop={shop} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `contract-${contract.id}.pdf`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error generating contract PDF:", error);
            toast.error("Failed to generate PDF.");
        }
    };

    const handleOpenPreview = (contract: any) => {
        setSelectedContract(contract);
        setIsPreviewOpen(true);
    };

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
    }, [shopId]);

    const handleSort = () => {
        setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
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
            .sort((a, b) => {
                const dateA = new Date(a.created_at).getTime();
                const dateB = new Date(b.created_at).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - a.created_at;
            });
    }, [contracts, sortOrder]);

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
                <div className="flex items-center gap-2">
                    <Button
                        onClick={openEditorForNew}
                        disabled={!shop?.shop_name || !shop?.shop_address}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        New Contract
                    </Button>
                </div>
            </div>
            
            <ShopInfoCheck shop={shop} />
            <ContractStatusDashboard shopId={shopId} />

            <div className="flex justify-end items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    className="text-gray-300 border-gray-600 hover:bg-gray-700"
                    onClick={handleSort}
                >
                    Sort by Date
                    <ArrowUpDown className="h-4 w-4 ml-2" />
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedContracts.map((contract) => (
                    <ContractCard
                        key={contract.id}
                        contract={contract}
                        onEdit={() => openEditorForEdit(contract)}
                        onDelete={() => handleDelete(contract.id)}
                        onDownloadPDF={() => handleDownloadContractPDF(contract)}
                        onPreview={() => handleOpenPreview(contract)}
                        onSend={() => handleOpenSendConfirmation(contract)}
                        onRefresh={refreshContracts}
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

            <ContractPreviewDialog
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                contract={selectedContract}
                shop={shop}
            />

            <SendConfirmationDialog
                isOpen={!!contractToSend}
                onClose={() => setContractToSend(null)}
                onConfirm={handleSendContract}
                contract={contractToSend}
                customerEmail={contractToSend?.customer?.customer_email || 'N/A'}
            />
        </main>
    );
} 