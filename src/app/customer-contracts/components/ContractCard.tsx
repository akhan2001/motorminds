"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

const statusColors: { [key: string]: string } = {
    draft: "bg-gray-500 hover:bg-gray-600",
    sent: "bg-blue-500 hover:bg-blue-600",
    signed: "bg-green-500 hover:bg-green-600",
    declined: "bg-red-500 hover:bg-red-600",
};

export default function ContractCard({ contract, onEdit, onDelete }: { contract: any; onEdit: () => void; onDelete: () => void; }) {
    return (
        <Card className="bg-[#1A1A1A] border border-[#222222] text-white flex flex-col rounded-xl shadow-lg hover:border-[#333333] transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium text-gray-200">{contract.title}</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:bg-[#292929] hover:text-white">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#292929] text-white border-[#626262]">
                        <DropdownMenuItem onClick={onEdit} className="hover:!bg-[#363636] cursor-pointer">Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { /* Send logic here */ }} className="hover:!bg-[#363636] cursor-pointer">Send</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { /* Download logic here */ }} className="hover:!bg-[#363636] cursor-pointer">Download PDF</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500 hover:!bg-red-500/10 hover:!text-red-400 cursor-pointer" onClick={onDelete}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow pt-2">
                <div className="text-lg font-bold text-white">{contract.customer?.customer_name || 'N/A'}</div>
                <p className="text-xs text-gray-400">{contract.customer?.customer_email || 'No email'}</p>
                <p className="text-sm text-gray-300 mt-2">
                    {contract.vehicle?.year} {contract.vehicle?.make} {contract.vehicle?.model}
                </p>
                <Badge className={`mt-4 text-xs font-semibold py-1 px-3 rounded-full ${statusColors[contract.status] || 'bg-gray-700 hover:bg-gray-800'}`}>{contract.status}</Badge>
            </CardContent>
            <CardFooter className="text-xs text-gray-500 pt-4 border-t border-[#222222]">
                Created: {format(new Date(contract.created_at), 'MMM d, yyyy')}
            </CardFooter>
        </Card>
    );
} 