"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
    currentPage: number;
    pageSize: number;
    total: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
}

export function VehiclePagination({
    currentPage,
    pageSize,
    total,
    isLoading,
    onPageChange
}: PaginationProps) {
    return (
        <div className="flex items-center justify-between py-4">
            <p className="text-sm text-gray-400">
                Showing {currentPage * pageSize - pageSize + 1} to {Math.min(currentPage * pageSize, total)} of {total} vehicles
            </p>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="border-[#333] hover:bg-[#222] hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-400">
                    Page {currentPage} of {Math.ceil(total / pageSize)}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === Math.ceil(total / pageSize) || isLoading}
                    className="border-[#333] hover:bg-[#222] hover:text-white"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
} 