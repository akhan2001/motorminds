"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MoreHorizontal, PenTool, Eye } from "lucide-react";
import { DocuSealForm, SignatureStatusBadge } from "./DocuSeal";
import { sendContractForSignature } from "../utils/contract-utils";
import { toast } from "sonner";

interface ContractCardProps {
    contract: any;
    onEdit: () => void;
    onDelete: () => void;
    onDownloadPDF: () => void;
    onPreview: () => void;
    onSend: () => void; // Original send, might be replaced by DocuSeal flow
    onRefresh: () => void; // Added for refreshing dashboard
}

export default function ContractCard({
    contract,
    onEdit,
    onDelete,
    onDownloadPDF,
    onPreview,
    onSend,
    onRefresh
}: ContractCardProps) {
    const [isSigningOpen, setIsSigningOpen] = useState(false);

    const handleSendForSignature = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!contract.customer?.customer_email) {
            toast.error('Customer email is required for signature request');
            return;
        }
        try {
            // Send the contract for signature (this will create submission and send email)
            const response = await fetch('/api/contracts/send-signing-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contractId: contract.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send contract');
            }

            toast.success('Contract sent for signature!');
            const success = await sendContractForSignature(contract.id); // Update local status
            if (success) {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Error sending contract for signature:', error);
            toast.error(error.message || 'Failed to send contract for signature');
        }
    };

    const handleSignInPerson = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!contract.customer?.customer_email) {
            toast.error('Customer email is required for signing');
            return;
        }
        // For in-person signing, we'll open the DocuSeal form modal
        // The modal will create the submission when it opens
        setIsSigningOpen(true);
    };

    const handlePreviewHTML = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Open HTML preview in new tab
        const previewUrl = `/api/contracts/preview-html?contractId=${contract.id}`;
        window.open(previewUrl, '_blank');
    };

    const handleDownloadSigned = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (contract.signed_document_url) {
            window.open(contract.signed_document_url, '_blank');
        }
    };

    const signatureStatus = contract.signature_status || 'pending';

    return (
        <>
            <Card
                className="bg-[#1A1A1A] border border-[#222222] text-white flex flex-col rounded-xl shadow-lg hover:border-[#333333] transition-all duration-200 cursor-pointer"
                onClick={onPreview}
            >
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <div className="flex flex-col gap-2">
                        <CardTitle className="text-lg font-semibold text-white">{contract.title}</CardTitle>
                        <SignatureStatusBadge status={signatureStatus} />
                    </div>
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:bg-[#292929] hover:text-white" onClick={(e) => e.stopPropagation()}>
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#292929] text-white border-[#626262]">
                            <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                className="hover:!bg-[#363636] cursor-pointer"
                            >
                                Edit
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={handlePreviewHTML}
                                className="hover:!bg-[#363636] cursor-pointer"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview Signing Form
                            </DropdownMenuItem>

                            {signatureStatus === 'pending' && (
                                <>
                                    <DropdownMenuItem
                                        onClick={handleSendForSignature}
                                        className="hover:!bg-[#363636] cursor-pointer"
                                    >
                                        Send for Signature
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleSignInPerson}
                                        className="hover:!bg-[#363636] cursor-pointer"
                                    >
                                        <PenTool className="w-4 h-4 mr-2" />
                                        Sign in Person
                                    </DropdownMenuItem>
                                </>
                            )}

                            {signatureStatus === 'sent' && (
                                <DropdownMenuItem
                                    onClick={handleSignInPerson}
                                    className="hover:!bg-[#363636] cursor-pointer"
                                >
                                    <PenTool className="w-4 h-4 mr-2" />
                                    Sign in Person
                                </DropdownMenuItem>
                            )}

                            {signatureStatus === 'completed' && contract.signed_document_url && (
                                <DropdownMenuItem
                                    onClick={handleDownloadSigned}
                                    className="hover:!bg-[#363636] cursor-pointer"
                                >
                                    Download Signed PDF
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); onDownloadPDF(); }}
                                className="hover:!bg-[#363636] cursor-pointer"
                            >
                                Download Original PDF
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-red-500 hover:!bg-red-500/10 hover:!text-red-400 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>

                <CardContent className="flex-grow p-4 pt-0">
                    <div className="space-y-2">
                        <div className="text-md font-medium text-gray-200">
                            {contract.customer?.customer_name || 'No Customer Assigned'}
                        </div>
                        <p className="text-xs text-gray-400">
                            {contract.customer?.customer_email || 'No email assigned'}
                        </p>
                        {contract.vehicle && (
                            <p className="text-sm text-gray-300">
                                {contract.vehicle.year} {contract.vehicle.make} {contract.vehicle.model}
                            </p>
                        )}
                        {contract.signature_completed_at && (
                            <p className="text-xs text-green-400">
                                Signed: {format(new Date(contract.signature_completed_at), 'MMM d, yyyy')}
                            </p>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="text-xs text-gray-500 p-4 pt-2 border-t border-[#222222]">
                    Created: {format(new Date(contract.created_at), 'MMM d, yyyy')}
                </CardFooter>
            </Card>

            {/* DocuSeal In-Person Signing Modal */}
            <DocuSealForm
                isOpen={isSigningOpen}
                onClose={() => setIsSigningOpen(false)}
                contract={contract}
                templateUrl="" // Not needed for HTML-based approach
                onCompleted={() => {
                    onRefresh();
                    setIsSigningOpen(false);
                }}
            />
        </>
    );
} 