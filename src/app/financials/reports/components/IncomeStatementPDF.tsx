import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getShopInfo } from '@/utils/supabase/supabase-shop';

interface IncomeStatementData {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    netProfit: number;
    // Granular revenue breakdown
    totalPartsRevenue?: number;
    totalLaborRevenue?: number;
    totalServicesRevenue?: number;
    totalFeesRevenue?: number;
    totalTaxAmount?: number;
    totalDiscountAmount?: number;
    totalSubtotal?: number;
    // Details
    revenueDetails: { 
        description: string; 
        total_amount: number;
        invoice_number?: string;
        labor_total?: number;
        parts_total?: number;
        services_total?: number;
        fees_total?: number;
        paid_date?: string | null;
    }[];
    cogsDetails: { 
        item_name: string; 
        total_cost: number;
        quantity?: number;
        unit_cost?: number;
        part_number?: string;
        supplier?: string;
    }[];
    operatingExpenseDetails: { 
        category: string; 
        cost_name?: string; 
        total_amount: number 
    }[];
    startDate: string;
    endDate: string;
    invoiceCount?: number;
}

const formatCurrency = (value: number): string => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
};

export const generateIncomeStatementPDF = async (data: IncomeStatementData, shopId: string, statementId?: string | null) => {
    const shopInfo = await getShopInfo(shopId);
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPos = 20;
    const leftMargin = 20;
    const rightMargin = pageWidth - 20;

    // Calculate margins
    const grossMargin = data.totalRevenue > 0 ? (data.grossProfit / data.totalRevenue) * 100 : 0;
    const netMargin = data.totalRevenue > 0 ? (data.netProfit / data.totalRevenue) * 100 : 0;

    // -- HEADER --
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(shopInfo?.shop_name || 'Auto Shop', leftMargin, yPos);
    
    yPos += 8;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Income Statement', leftMargin, yPos);
    
    yPos += 6;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const periodStr = `For the period: ${new Date(data.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to ${new Date(data.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    pdf.text(periodStr, leftMargin, yPos);
    
    // Statement ID on right
    if (statementId) {
        pdf.setFontSize(9);
        pdf.text(`Statement #${statementId}`, rightMargin, 20, { align: 'right' });
    }

    // Line under header
    yPos += 5;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, rightMargin, yPos);
    
    yPos += 12;

    // Helper function to check page break
    const checkPageBreak = (requiredSpace: number) => {
        if (yPos > pageHeight - requiredSpace) {
            pdf.addPage();
            yPos = 20;
        }
    };

    // Helper to draw a simple section title
    const drawSectionTitle = (title: string) => {
        checkPageBreak(20);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        pdf.text(title, leftMargin, yPos);
        yPos += 2;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(leftMargin, yPos, rightMargin, yPos);
        yPos += 6;
        pdf.setTextColor(0, 0, 0);
    };

    // Helper to draw a line item
    const drawLineItem = (label: string, amount: number, indent: number = 0, bold: boolean = false, showBrackets: boolean = false) => {
        checkPageBreak(8);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.text(label, leftMargin + indent, yPos);
        const amountStr = showBrackets ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount);
        pdf.text(amountStr, rightMargin, yPos, { align: 'right' });
        yPos += 6;
    };

    // Helper to draw subtotal line
    const drawSubtotalLine = (label: string, amount: number) => {
        checkPageBreak(10);
        pdf.setDrawColor(150, 150, 150);
        pdf.setLineWidth(0.2);
        pdf.line(rightMargin - 40, yPos - 2, rightMargin, yPos - 2);
        yPos += 2;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, leftMargin + 4, yPos);
        pdf.text(formatCurrency(amount), rightMargin, yPos, { align: 'right' });
        yPos += 8;
    };

    // ==================== REVENUE SECTION ====================
    drawSectionTitle('REVENUE');

    // Revenue breakdown
    if (data.totalLaborRevenue && data.totalLaborRevenue > 0) {
        drawLineItem('Labor Revenue', data.totalLaborRevenue, 4);
    }
    if (data.totalPartsRevenue && data.totalPartsRevenue > 0) {
        drawLineItem('Parts Revenue', data.totalPartsRevenue, 4);
    }
    if (data.totalServicesRevenue && data.totalServicesRevenue > 0) {
        drawLineItem('Services Revenue', data.totalServicesRevenue, 4);
    }
    if (data.totalFeesRevenue && data.totalFeesRevenue > 0) {
        drawLineItem('Shop Fees & Other', data.totalFeesRevenue, 4);
    }

    // Subtotal before tax
    if (data.totalSubtotal) {
        yPos += 2;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text('Subtotal (before tax)', leftMargin + 8, yPos);
        pdf.text(formatCurrency(data.totalSubtotal), rightMargin, yPos, { align: 'right' });
        yPos += 5;
        pdf.setTextColor(0, 0, 0);
    }

    // Tax collected
    if (data.totalTaxAmount && data.totalTaxAmount > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text('Tax Collected (HST 13%)', leftMargin + 8, yPos);
        pdf.text(formatCurrency(data.totalTaxAmount), rightMargin, yPos, { align: 'right' });
        yPos += 5;
        pdf.setTextColor(0, 0, 0);
    }

    // Discounts
    if (data.totalDiscountAmount && data.totalDiscountAmount > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text('Less: Discounts', leftMargin + 8, yPos);
        pdf.text(`(${formatCurrency(data.totalDiscountAmount)})`, rightMargin, yPos, { align: 'right' });
        yPos += 5;
        pdf.setTextColor(0, 0, 0);
    }

    drawSubtotalLine('Total Revenue', data.totalRevenue);

    // Invoice count note
    if (data.invoiceCount) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(120, 120, 120);
        pdf.text(`(Based on ${data.invoiceCount} paid invoice${data.invoiceCount !== 1 ? 's' : ''})`, leftMargin + 4, yPos - 4);
        pdf.setTextColor(0, 0, 0);
    }

    yPos += 4;

    // ==================== COST OF GOODS SOLD ====================
    drawSectionTitle('COST OF GOODS SOLD');

    if (data.cogsDetails && data.cogsDetails.length > 0) {
        // Show summary by category or first few items
        const cogsItems = data.cogsDetails.slice(0, 10);
        cogsItems.forEach(item => {
            const name = item.item_name || 'Parts';
            const qty = item.quantity ? ` (×${item.quantity})` : '';
            drawLineItem(`${name}${qty}`, item.total_cost, 4);
        });
        
        if (data.cogsDetails.length > 10) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100);
            pdf.text(`... and ${data.cogsDetails.length - 10} more items`, leftMargin + 8, yPos);
            yPos += 5;
            pdf.setTextColor(0, 0, 0);
        }
    } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('No parts costs recorded', leftMargin + 4, yPos);
        yPos += 5;
        pdf.setTextColor(0, 0, 0);
    }

    drawSubtotalLine('Total Cost of Goods Sold', data.totalCOGS);

    // ==================== GROSS PROFIT ====================
    yPos += 2;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(leftMargin, yPos - 4, rightMargin - leftMargin, 10, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GROSS PROFIT', leftMargin + 4, yPos + 2);
    pdf.text(`${formatCurrency(data.grossProfit)}  (${formatPercent(grossMargin)} margin)`, rightMargin - 4, yPos + 2, { align: 'right' });
    yPos += 14;

    // ==================== OPERATING EXPENSES ====================
    drawSectionTitle('OPERATING EXPENSES');

    // Separate fixed costs and one-time expenses
    const fixedCosts = data.operatingExpenseDetails.filter(e => e.category === 'Fixed Cost' || e.category?.includes('Fixed'));
    const oneTimeCosts = data.operatingExpenseDetails.filter(e => e.category !== 'Fixed Cost' && !e.category?.includes('Fixed'));

    if (fixedCosts.length > 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text('Recurring/Fixed Costs:', leftMargin + 4, yPos);
        yPos += 5;
        pdf.setTextColor(0, 0, 0);

        fixedCosts.forEach(item => {
            drawLineItem(item.cost_name || item.category || 'Fixed Cost', item.total_amount, 8);
        });
        yPos += 2;
    }

    if (oneTimeCosts.length > 0) {
        checkPageBreak(20);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80, 80, 80);
        pdf.text('One-Time Expenses:', leftMargin + 4, yPos);
        yPos += 5;
        pdf.setTextColor(0, 0, 0);

        oneTimeCosts.slice(0, 15).forEach(item => {
            drawLineItem(item.cost_name || item.category || 'Expense', item.total_amount, 8);
        });

        if (oneTimeCosts.length > 15) {
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'italic');
            pdf.setTextColor(100, 100, 100);
            pdf.text(`... and ${oneTimeCosts.length - 15} more expenses`, leftMargin + 12, yPos);
            yPos += 5;
            pdf.setTextColor(0, 0, 0);
        }
        yPos += 2;
    }

    if (data.operatingExpenseDetails.length === 0) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text('No operating expenses recorded', leftMargin + 4, yPos);
        yPos += 5;
        pdf.setTextColor(0, 0, 0);
    }

    drawSubtotalLine('Total Operating Expenses', data.totalOperatingExpenses);

    // ==================== NET PROFIT ====================
    yPos += 4;
    checkPageBreak(20);
    
    // Double line above net profit
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(leftMargin, yPos, rightMargin, yPos);
    pdf.line(leftMargin, yPos + 1.5, rightMargin, yPos + 1.5);
    yPos += 8;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('NET PROFIT / (LOSS)', leftMargin, yPos);
    pdf.text(`${formatCurrency(data.netProfit)}`, rightMargin, yPos, { align: 'right' });
    yPos += 6;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Net Profit Margin: ${formatPercent(netMargin)}`, rightMargin, yPos, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    
    yPos += 15;

    // ==================== SUMMARY TABLE ====================
    checkPageBreak(60);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary', leftMargin, yPos);
    yPos += 5;

    autoTable(pdf, {
        startY: yPos,
        body: [
            ['Total Revenue', formatCurrency(data.totalRevenue)],
            ['Less: Cost of Goods Sold', `(${formatCurrency(data.totalCOGS)})`],
            ['Gross Profit', formatCurrency(data.grossProfit)],
            ['Less: Operating Expenses', `(${formatCurrency(data.totalOperatingExpenses)})`],
            ['Net Profit / (Loss)', formatCurrency(data.netProfit)]
        ],
        theme: 'plain',
        styles: { 
            fontSize: 10, 
            cellPadding: 4, 
            textColor: [0, 0, 0],
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        columnStyles: {
            0: { fontStyle: 'normal', cellWidth: 100 },
            1: { halign: 'right', fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            // Make last row bold
            if (data.row.index === 4) {
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    // ==================== FOOTER ====================
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 12;
        
        // Light line above footer
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(leftMargin, footerY - 4, rightMargin, footerY - 4);
        
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Page ${i} of ${pageCount}`, leftMargin, footerY);
        
        const footerParts = [
            shopInfo?.shop_address,
            shopInfo?.shop_phone,
            shopInfo?.hst_number ? `HST: ${shopInfo.hst_number}` : null
        ].filter(Boolean);
        
        if (footerParts.length > 0) {
            pdf.text(footerParts.join(' • '), pageWidth / 2, footerY, { align: 'center' });
        }
        
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, rightMargin, footerY, { align: 'right' });
    }
    
    const startStr = new Date(data.startDate).toLocaleDateString('en-CA');
    const endStr = new Date(data.endDate).toLocaleDateString('en-CA');
    pdf.save(`Income_Statement_${statementId ?? 'draft'}_${startStr}_to_${endStr}.pdf`);
};

// CSV Export function
export const generateIncomeStatementCSV = (data: IncomeStatementData, statementId?: string | null) => {
    const rows: string[][] = [];
    
    // Header
    rows.push(['INCOME STATEMENT']);
    rows.push([`Period: ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`]);
    if (statementId) rows.push([`Statement #${statementId}`]);
    rows.push([]);
    
    // Revenue
    rows.push(['REVENUE', '']);
    if (data.totalLaborRevenue) rows.push(['  Labor Revenue', data.totalLaborRevenue.toFixed(2)]);
    if (data.totalPartsRevenue) rows.push(['  Parts Revenue', data.totalPartsRevenue.toFixed(2)]);
    if (data.totalServicesRevenue) rows.push(['  Services Revenue', data.totalServicesRevenue.toFixed(2)]);
    if (data.totalFeesRevenue) rows.push(['  Shop Fees', data.totalFeesRevenue.toFixed(2)]);
    if (data.totalSubtotal) rows.push(['  Subtotal (before tax)', data.totalSubtotal.toFixed(2)]);
    if (data.totalTaxAmount) rows.push(['  Tax Collected', data.totalTaxAmount.toFixed(2)]);
    if (data.totalDiscountAmount) rows.push(['  Less: Discounts', (-data.totalDiscountAmount).toFixed(2)]);
    rows.push(['TOTAL REVENUE', data.totalRevenue.toFixed(2)]);
    rows.push([]);
    
    // COGS
    rows.push(['COST OF GOODS SOLD', '']);
    data.cogsDetails.forEach(item => {
        rows.push([`  ${item.item_name || 'Part'}`, item.total_cost.toFixed(2)]);
    });
    rows.push(['TOTAL COGS', data.totalCOGS.toFixed(2)]);
    rows.push([]);
    
    // Gross Profit
    rows.push(['GROSS PROFIT', data.grossProfit.toFixed(2)]);
    rows.push([]);
    
    // Operating Expenses
    rows.push(['OPERATING EXPENSES', '']);
    data.operatingExpenseDetails.forEach(item => {
        rows.push([`  ${item.cost_name || item.category}`, item.total_amount.toFixed(2)]);
    });
    rows.push(['TOTAL OPERATING EXPENSES', data.totalOperatingExpenses.toFixed(2)]);
    rows.push([]);
    
    // Net Profit
    rows.push(['NET PROFIT / (LOSS)', data.netProfit.toFixed(2)]);
    
    // Convert to CSV string
    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const startStr = new Date(data.startDate).toLocaleDateString('en-CA');
    const endStr = new Date(data.endDate).toLocaleDateString('en-CA');
    link.setAttribute('download', `Income_Statement_${statementId ?? 'draft'}_${startStr}_to_${endStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
