'use client'

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocusealForm as DocuSealFormComponent } from '@docuseal/react';
import { markContractViewed, markContractCompleted, markContractDeclined } from "../../utils/contract-utils";
import { createDocuSealSubmission } from "../../utils/docuseal-utils";
import { config } from '@/lib/config';

interface DocuSealFormProps {
    isOpen: boolean;
    onClose: () => void;
    contract: any;
    templateUrl: string; // Not used anymore with HTML approach
    onCompleted: () => void;
}

export function DocuSealForm({ isOpen, onClose, contract, templateUrl, onCompleted }: DocuSealFormProps) {
    const [submissionSlug, setSubmissionSlug] = useState<string | null>(null);
    const [isCreatingSubmission, setIsCreatingSubmission] = useState(false);

    // Create submission when form opens
    useEffect(() => {
        if (isOpen && contract && !submissionSlug) {
            createSubmission();
        }
    }, [isOpen, contract]);

    const createSubmission = async () => {
        if (!contract.customer?.customer_email) {
            console.error('Customer email is required');
            return;
        }

        setIsCreatingSubmission(true);
        try {
            // Create HTML-based submission directly
            const result = await createDocuSealSubmission({
                contractId: contract.id,
                customerEmail: contract.customer.customer_email,
                customerName: contract.customer.customer_name || 'Customer'
            });

            setSubmissionSlug(result.slug);

            // Mark as viewed when submission is created
            await markContractViewed(contract.id);
        } catch (error) {
            console.error('Error creating submission:', error);
        } finally {
            setIsCreatingSubmission(false);
        }
    };

    const handleCompleted = async (data: any) => {
        console.log('Contract signed:', data);
        const success = await markContractCompleted(contract.id, data);
        if (success) {
            onCompleted();
            onClose();
        }
    };

    const handleDeclined = async (data: any) => {
        console.log('Contract declined:', data);
        const success = await markContractDeclined(contract.id, data);
        if (success) {
            onCompleted();
            onClose();
        }
    };

    const handleError = (error: any) => {
        console.error('DocuSeal form error:', error);
    };

    if (!isOpen || !contract.customer?.customer_email) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[95vh] bg-white text-black p-0">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl font-semibold">
                        Sign Contract: {contract.title}
                    </DialogTitle>
                    {contract.customer && (
                        <p className="text-sm text-gray-600 mt-1">
                            Customer: {contract.customer.customer_name} ({contract.customer.customer_email})
                        </p>
                    )}
                </DialogHeader>

                <div className="px-6 pb-6">
                    <div className="h-[75vh] rounded-lg border overflow-hidden">
                        {isCreatingSubmission ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Preparing contract for signing...</p>
                                </div>
                            </div>
                        ) : submissionSlug ? (
                            <DocuSealFormComponent
                                src={`${config.docuseal.baseUrl}/s/${submissionSlug}`}
                                onComplete={handleCompleted}
                                onDecline={handleDeclined}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-600">Failed to load signing form</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}