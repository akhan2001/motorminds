"use client"

import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

interface VehicleTableHeaderProps {
    sortConfig: SortConfig;
    onSort: (key: string) => void;
}

export function VehicleTableHeader({ sortConfig, onSort }: VehicleTableHeaderProps) {
    const columns = [
        { key: 'year', label: 'Year' },
        { key: 'make', label: 'Make' },
        { key: 'model', label: 'Model' },
        { key: 'vin', label: 'VIN' },
        { key: 'license_plate', label: 'License Plate' },
        { key: 'color', label: 'Color' },
        { key: 'mileage', label: 'Mileage' },
        { key: 'engine_type', label: 'Engine' },
    ];

    return (
        <TableHeader>
            <TableRow className="border-[#222] hover:bg-[#1a1a1a]">
                {columns.map(({ key, label }) => (
                    <TableHead
                        key={key}
                        className="text-gray-400 cursor-pointer"
                        onClick={() => onSort(key)}
                    >
                        {label} {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </TableHead>
                ))}
            </TableRow>
        </TableHeader>
    )
} 