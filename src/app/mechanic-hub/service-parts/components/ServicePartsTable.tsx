import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Edit2, Trash2 } from "lucide-react";
import { Service } from "../types";

interface ServicePartsTableProps {
    services: Service[];
    isLoading: boolean;
    onEdit: (service: Service) => void;
    onDelete: (id: string) => void;
}

export function ServicePartsTable({ services, isLoading, onEdit, onDelete }: ServicePartsTableProps) {
    if (isLoading) {
        return (
            <div className="text-center py-10">Loading...</div>
        );
    }
    
    return (
        <div className="border border-[#222] rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-[#333] hover:bg-transparent">
                        <TableHead className="text-white">Type</TableHead>
                        <TableHead className="text-white">Service/Part Name</TableHead>
                        <TableHead className="text-white">Description</TableHead>
                        <TableHead className="text-white text-right">Price</TableHead>
                        <TableHead className="text-white text-right">Cost</TableHead>
                        <TableHead className="text-white text-right">Quantity</TableHead>
                        <TableHead className="text-white text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {services.map(service => (
                        <TableRow key={service.id} className="border-b-0">
                            <TableCell className="capitalize text-gray-300">{service.type}</TableCell>
                            <TableCell className="font-medium text-white">{service.service_name}</TableCell>
                            <TableCell className="text-gray-300 max-w-xs truncate">{service.description}</TableCell>
                            <TableCell className="text-right text-gray-300">${service.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-gray-300">
                                {service.type === 'parts' && service.cost ? `$${service.cost.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right text-gray-300">
                                {service.type === 'parts' ? service.quantity : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex item-center justify-center">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(service)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(service.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 