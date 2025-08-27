"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

export function ContractPreviewDialog({ isOpen, onClose, contract, shop }: { isOpen: boolean; onClose: () => void; contract: any; shop: any; }) {
    if (!isOpen || !contract || !shop) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-4 sm:p-6 w-[95vw] max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <div id="contract-container" className="bg-[#1A1A1A] text-white p-4 sm:p-6 rounded-lg border border-[#333333]">
                    <DialogHeader className="mb-4 text-left">
                        <DialogTitle className="text-2xl font-bold text-white">
                            {contract.title || 'Service Contract'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Created on: {format(new Date(contract.created_at), 'MMMM d, yyyy')}
                        </DialogDescription>
                    </DialogHeader>

                    <Separator className="my-4 bg-gray-700" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Shop Information</h3>
                            <p className="text-white font-medium">{shop.shop_name}</p>
                            <p className="text-gray-400 text-sm">{shop.shop_address}</p>
                            <p className="text-gray-400 text-sm">{shop.shop_email}</p>
                            <p className="text-gray-400 text-sm">{shop.shop_phone}</p>
                        </div>
                
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-white">Client Information</h3>
                            <p className="text-white font-medium">{contract.customer?.customer_name || 'N/A'}</p>
                            <p className="text-gray-400 text-sm">{contract.customer?.customer_email || 'No email'}</p>
                            <p className="text-gray-400 text-sm">{contract.customer?.customer_phone || 'No phone'}</p>
                            <p className="text-gray-400 text-sm">{contract.customer?.customer_address || 'No address'}</p>
                        </div>
                    </div>

                    {contract.vehicle && (
                        <>
                            <Separator className="my-4 bg-gray-700" />
                            <div className="space-y-2 mb-6">
                                <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
                                <p className="text-white">
                                    {contract.vehicle.year} {contract.vehicle.make} {contract.vehicle.model}
                                </p>
                            </div>
                        </>
                    )}

                    <Separator className="my-4 bg-gray-700" />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Contract Terms</h3>
                        <div className="text-gray-300 text-sm leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>
                            {contract.content || "No contract text available. Please generate it in the editor."}
                        </div>
                    </div>
                </div>
        
                <DialogFooter className="mt-4 flex flex-row justify-end gap-2">
                    <Button 
                        className="bg-gray-600 text-white hover:bg-gray-700 border-none" 
                        onClick={onClose}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>    
    );
} 