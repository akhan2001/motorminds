import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/lib/utils/currency';

// Extend the jsPDF type to include the autoTable method
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
}

const formatDate = (date: Date) => date.toLocaleDateString('en-US');

export const generateArAgingReport = (data: any, allInvoices: any[], shopName: string = "Your Shop") => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const reportDate = new Date();

    // 1. Header
    doc.setFontSize(18);
    doc.text('Accounts Receivable Aging Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`For: ${shopName}`, 14, 30);
    doc.text(`As of: ${formatDate(reportDate)}`, 14, 36);

    // 2. Summary Section
    autoTable(doc, {
        startY: 45,
        head: [['Category', 'Total Amount']],
        body: [
            ['Current (0-30 Days)', formatCurrency(data.agingBuckets.current.total)],
            ['31-60 Days', formatCurrency(data.agingBuckets.thirtyOneToSixty.total)],
            ['61-90 Days', formatCurrency(data.agingBuckets.sixtyOneToNinety.total)],
            ['90+ Days', formatCurrency(data.agingBuckets.ninetyPlus.total)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
        foot: [
            [{ content: 'Total Accounts Receivable', colSpan: 1, styles: { fontStyle: 'bold' } }, { content: formatCurrency(data.totalAR), styles: { fontStyle: 'bold' } }]
        ],
        footStyles: { fillColor: [230, 230, 230], textColor: 0 },
    });

    // 3. Detailed Invoice Table
    const tableBody = allInvoices.map(inv => {
        const issueDate = new Date(inv.issue_date);
        const age = Math.round((reportDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24));
        return [
            inv.display_id,
            inv.client_name,
            formatDate(issueDate),
            age,
            formatCurrency(inv.amount)
        ];
    });

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Invoice #', 'Customer', 'Issue Date', 'Age (Days)', 'Amount Due']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
    });

    // 4. Footer with page numbers
    const pageCount = (doc.internal as any).getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, 287, { align: 'center' });
    }

    // 5. Save the PDF
    doc.save(`AR_Aging_Report_${reportDate.toISOString().split('T')[0]}.pdf`);
};

export const generateArAgingCsv = (allInvoices: any[]) => {
    const reportDate = new Date();
    const headers = ['Invoice #', 'Customer', 'Issue Date', 'Age (Days)', 'Amount Due'];

    const csvRows = [headers.join(',')]; // Start with the header row

    allInvoices.forEach(inv => {
        const issueDate = new Date(inv.issue_date);
        const age = Math.round((reportDate.getTime() - issueDate.getTime()) / (1000 * 3600 * 24));
        
        // Escape commas in customer name by wrapping in quotes
        const customerName = `"${inv.client_name}"`;

        const row = [
            inv.display_id,
            customerName,
            formatDate(issueDate),
            age,
            inv.amount // No currency formatting for CSV
        ].join(',');
        csvRows.push(row);
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `AR_Aging_Report_${reportDate.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
