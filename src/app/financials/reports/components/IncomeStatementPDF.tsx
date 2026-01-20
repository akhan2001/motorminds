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
    const leftMargin = 14;
    const rightMargin = pageWidth - 14;
    const contentWidth = rightMargin - leftMargin;

    // Calculate margins
    const grossMargin = data.totalRevenue > 0 ? (data.grossProfit / data.totalRevenue) * 100 : 0;
    const netMargin = data.totalRevenue > 0 ? (data.netProfit / data.totalRevenue) * 100 : 0;

    // -- HEADER --
    pdf.setFillColor(0, 0, 0); // Black
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(shopInfo?.shop_name || 'MotorMinds Auto Shop', leftMargin, 16);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('INCOME STATEMENT', leftMargin, 26);
    
    pdf.setFontSize(9);
    const periodStr = `Period: ${new Date(data.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} to ${new Date(data.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    pdf.text(periodStr, leftMargin, 32);
    
    // Statement ID on right
    if (statementId) {
        pdf.setFontSize(9);
        pdf.text(`Statement #${statementId}`, rightMargin, 32, { align: 'right' });
    }

    yPos = 45;
    pdf.setTextColor(0, 0, 0);

    // -- EXECUTIVE SUMMARY BOX --
    pdf.setFillColor(245, 245, 245); // Light gray
    pdf.setDrawColor(200, 200, 200); // Medium gray border
    pdf.roundedRect(leftMargin, yPos, contentWidth, 36, 2, 2, 'FD');

    const summaryY = yPos + 10;
    const colWidth = contentWidth / 4;
    
    // Summary metrics
    const summaryItems = [
        { label: 'Total Revenue', value: formatCurrency(data.totalRevenue) },
        { label: 'Gross Profit', value: formatCurrency(data.grossProfit), subtext: `${formatPercent(grossMargin)} margin` },
        { label: 'Operating Expenses', value: formatCurrency(data.totalOperatingExpenses) },
        { label: 'Net Profit', value: formatCurrency(data.netProfit), subtext: `${formatPercent(netMargin)} margin` }
    ];

    summaryItems.forEach((item, i) => {
        const x = leftMargin + (colWidth * i) + (colWidth / 2);
        
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100); // Gray
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.label, x, summaryY, { align: 'center' });
        
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0); // Black
        pdf.text(item.value, x, summaryY + 9, { align: 'center' });
        
        if (item.subtext) {
            pdf.setFontSize(7);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.text(item.subtext, x, summaryY + 15, { align: 'center' });
        }
    });

    yPos += 44;
    pdf.setTextColor(0, 0, 0);

    // Helper function to check page break
    const checkPageBreak = (requiredSpace: number) => {
        if (yPos > pageHeight - requiredSpace) {
            pdf.addPage();
            yPos = 20;
        }
    };

    // Helper function to draw section header
    const drawSectionHeader = (title: string) => {
        checkPageBreak(30);
        pdf.setFillColor(0, 0, 0); // Black
        pdf.rect(leftMargin, yPos, contentWidth, 7, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text(title, leftMargin + 3, yPos + 5);
        yPos += 9;
        pdf.setTextColor(0, 0, 0);
    };

    // -- REVENUE SECTION --
    drawSectionHeader('REVENUE');

    // Revenue breakdown summary
    const revenueBreakdown = [
        { label: 'Labor Revenue', value: data.totalLaborRevenue || 0 },
        { label: 'Parts Revenue', value: data.totalPartsRevenue || 0 },
        { label: 'Services Revenue', value: data.totalServicesRevenue || 0 },
        { label: 'Shop Fees', value: data.totalFeesRevenue || 0 },
    ].filter(item => item.value > 0);

    if (revenueBreakdown.length > 0) {
        autoTable(pdf, {
            startY: yPos,
            head: [['Revenue Category', 'Amount', '% of Revenue']],
            body: revenueBreakdown.map(item => [
                item.label,
                formatCurrency(item.value),
                formatPercent(data.totalRevenue > 0 ? (item.value / data.totalRevenue) * 100 : 0)
            ]),
            foot: [['Subtotal (before tax)', formatCurrency(data.totalSubtotal || data.totalRevenue), '']],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 3, textColor: [0, 0, 0] },
            headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
            footStyles: { fillColor: [230, 230, 230], fontStyle: 'bold', textColor: [0, 0, 0] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' }
            }
        });
        yPos = (pdf as any).lastAutoTable.finalY + 3;
    }

    // Tax and discounts
    if ((data.totalTaxAmount && data.totalTaxAmount > 0) || (data.totalDiscountAmount && data.totalDiscountAmount > 0)) {
        const adjustments = [];
        if (data.totalTaxAmount && data.totalTaxAmount > 0) {
            adjustments.push(['  Tax Collected', formatCurrency(data.totalTaxAmount)]);
        }
        if (data.totalDiscountAmount && data.totalDiscountAmount > 0) {
            adjustments.push(['  Less: Discounts', `(${formatCurrency(data.totalDiscountAmount)})`]);
        }
        
        autoTable(pdf, {
            startY: yPos,
            body: adjustments,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2, textColor: [80, 80, 80] },
            columnStyles: { 1: { halign: 'right' } }
        });
        yPos = (pdf as any).lastAutoTable.finalY + 2;
    }

    // Total Revenue line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('TOTAL REVENUE', leftMargin, yPos);
    pdf.text(formatCurrency(data.totalRevenue), rightMargin, yPos, { align: 'right' });
    yPos += 10;

    // Invoice count note
    if (data.invoiceCount) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Based on ${data.invoiceCount} paid invoice${data.invoiceCount !== 1 ? 's' : ''} in period`, leftMargin, yPos - 3);
        pdf.setTextColor(0, 0, 0);
    }

    // -- COST OF GOODS SOLD SECTION --
    drawSectionHeader('COST OF GOODS SOLD (COGS)');

    if (data.cogsDetails && data.cogsDetails.length > 0) {
        const cogsBody = data.cogsDetails.slice(0, 15).map(item => [
            item.item_name || 'Part',
            item.part_number || '-',
            item.quantity?.toString() || '1',
            formatCurrency(item.unit_cost || 0),
            formatCurrency(item.total_cost)
        ]);

        if (data.cogsDetails.length > 15) {
            cogsBody.push([`... and ${data.cogsDetails.length - 15} more items`, '', '', '', '']);
        }

        autoTable(pdf, {
            startY: yPos,
            head: [['Part/Item', 'Part #', 'Qty', 'Unit Cost', 'Total Cost']],
            body: cogsBody,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0] },
            headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
            columnStyles: {
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        });
        yPos = (pdf as any).lastAutoTable.finalY + 3;
    } else {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text('No parts costs recorded for this period', leftMargin + 4, yPos + 4);
        pdf.setTextColor(0, 0, 0);
        yPos += 10;
    }

    // Total COGS line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('TOTAL COGS', leftMargin, yPos);
    pdf.text(formatCurrency(data.totalCOGS), rightMargin, yPos, { align: 'right' });
    yPos += 10;

    // -- GROSS PROFIT LINE --
    checkPageBreak(18);
    pdf.setFillColor(230, 230, 230); // Light gray
    pdf.roundedRect(leftMargin, yPos - 3, contentWidth, 10, 1, 1, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text('GROSS PROFIT', leftMargin + 3, yPos + 4);
    pdf.text(`${formatCurrency(data.grossProfit)}  (${formatPercent(grossMargin)} margin)`, rightMargin - 3, yPos + 4, { align: 'right' });
    yPos += 14;

    // -- OPERATING EXPENSES SECTION --
    drawSectionHeader('OPERATING EXPENSES');

    // Separate fixed costs and one-time expenses
    const fixedCosts = data.operatingExpenseDetails.filter(e => e.category === 'Fixed Cost' || e.category?.includes('Fixed'));
    const oneTimeCosts = data.operatingExpenseDetails.filter(e => e.category !== 'Fixed Cost' && !e.category?.includes('Fixed'));

    if (data.operatingExpenseDetails.length > 0) {
        // Fixed/Recurring costs
        if (fixedCosts.length > 0) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.text('Recurring Costs', leftMargin + 3, yPos + 2);
            yPos += 5;

            autoTable(pdf, {
                startY: yPos,
                body: fixedCosts.map(item => [
                    item.cost_name || item.category || 'Fixed Cost',
                    formatCurrency(item.total_amount)
                ]),
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 2, textColor: [0, 0, 0] },
                columnStyles: { 1: { halign: 'right' } }
            });
            yPos = (pdf as any).lastAutoTable.finalY + 3;
            
            const totalFixed = fixedCosts.reduce((sum, c) => sum + c.total_amount, 0);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Subtotal - Recurring:', leftMargin + 6, yPos);
            pdf.text(formatCurrency(totalFixed), rightMargin, yPos, { align: 'right' });
            yPos += 7;
        }

        // One-time expenses
        if (oneTimeCosts.length > 0) {
            checkPageBreak(25);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.text('One-Time Expenses', leftMargin + 3, yPos + 2);
            yPos += 5;

            autoTable(pdf, {
                startY: yPos,
                body: oneTimeCosts.slice(0, 20).map(item => [
                    item.cost_name || item.category || 'Expense',
                    item.category || '-',
                    formatCurrency(item.total_amount)
                ]),
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 2, textColor: [0, 0, 0] },
                columnStyles: { 2: { halign: 'right' } }
            });
            yPos = (pdf as any).lastAutoTable.finalY + 3;

            const totalOneTime = oneTimeCosts.reduce((sum, c) => sum + c.total_amount, 0);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Subtotal - One-Time:', leftMargin + 6, yPos);
            pdf.text(formatCurrency(totalOneTime), rightMargin, yPos, { align: 'right' });
            yPos += 7;
        }
    } else {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text('No operating expenses recorded for this period', leftMargin + 4, yPos + 4);
        pdf.setTextColor(0, 0, 0);
        yPos += 10;
    }

    // Total Operating Expenses line
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, yPos, rightMargin, yPos);
    yPos += 5;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('TOTAL OPERATING EXPENSES', leftMargin, yPos);
    pdf.text(formatCurrency(data.totalOperatingExpenses), rightMargin, yPos, { align: 'right' });
    yPos += 14;

    // -- NET PROFIT LINE --
    checkPageBreak(22);
    pdf.setFillColor(0, 0, 0); // Black
    pdf.roundedRect(leftMargin, yPos - 3, contentWidth, 14, 2, 2, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text('NET PROFIT / (LOSS)', leftMargin + 4, yPos + 6);
    pdf.text(`${formatCurrency(data.netProfit)}  (${formatPercent(netMargin)} margin)`, rightMargin - 4, yPos + 6, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    yPos += 22;

    // -- SUMMARY TABLE --
    checkPageBreak(50);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
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
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 4, textColor: [0, 0, 0] },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // -- FOOTER --
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 10;
        
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${i} of ${pageCount}`, leftMargin, footerY);
        
        const footerText = [
            shopInfo?.shop_name,
            shopInfo?.shop_address,
            shopInfo?.shop_phone,
            shopInfo?.hst_number ? `HST: ${shopInfo.hst_number}` : null
        ].filter(Boolean).join(' | ');
        pdf.text(footerText, rightMargin, footerY, { align: 'right' });
        
        pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });
    }
    
    const startStr = new Date(data.startDate).toLocaleDateString('en-CA');
    const endStr = new Date(data.endDate).toLocaleDateString('en-CA');
    pdf.save(`Income_Statement_${statementId ?? 'draft'}_${startStr}_to_${endStr}.pdf`);
};
