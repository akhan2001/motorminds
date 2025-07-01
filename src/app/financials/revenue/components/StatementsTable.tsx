"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function StatementsTable({ statements }: { statements: any[] }) {
    if (statements.length === 0) {
        return (
            <div className="bg-[#1a1a1a] rounded-xl p-6 text-center text-gray-400">
                <h3 className="text-lg font-semibold text-white mb-4">Past Statements</h3>
                <p>No historical statements found. Generate one for the current month to get started.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-[#1a1a1a] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 px-2">Past Statements</h3>
            <Table>
                <TableHeader>
                    <TableRow className="border-b border-gray-700 hover:bg-transparent">
                        <TableHead className="text-gray-400">Period</TableHead>
                        <TableHead className="text-gray-400 text-right">Total Revenue</TableHead>
                        <TableHead className="text-gray-400 text-right">Gross Profit</TableHead>
                        <TableHead className="text-gray-400 text-right">Net Profit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {statements.map((stmt) => (
                        <TableRow key={stmt.id} className="border-b border-gray-800 hover:bg-[#222]">
                            <TableCell className="font-medium text-white">{formatDate(stmt.period_start_date)}</TableCell>
                            <TableCell className="text-right text-green-400">{formatCurrency(stmt.total_revenue)}</TableCell>
                            <TableCell className="text-right text-yellow-400">{formatCurrency(stmt.gross_profit)}</TableCell>
                            <TableCell className="text-right text-blue-400">{formatCurrency(stmt.net_profit)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 