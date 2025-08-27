import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getShopInfo } from '@/utils/supabase/supabase-shop';

interface IncomeStatementData {
    totalRevenue: number;
    totalCOGS: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    netProfit: number;
    revenueDetails: { description: string; total_amount: number }[];
    cogsDetails: { item_name: string; total_cost: number }[];
    operatingExpenseDetails: { category: string; cost_name?: string; total_amount: number }[];
    startDate: string;
    endDate: string;
}

export const generateIncomeStatementPDF = async (data: IncomeStatementData, shopId: string, statementId?: string | null) => {
    const shopInfo = await getShopInfo(shopId);
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 22; // Initial Y position
    const leftMargin = 14;
    const rightMargin = pdf.internal.pageSize.width - 14;

    // -- Header --
    pdf.setFontSize(20);
    pdf.text(shopInfo?.shop_name || 'MotorMinds Auto Shop', leftMargin, yPos);
    yPos += 10;
    pdf.setFontSize(16);
    pdf.text(`Income Statement (${statementId ?? 'Draft'})`, leftMargin, yPos);
    yPos += 8;
    pdf.setFontSize(10);
    pdf.text(`For the period from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`, leftMargin, yPos);
    yPos += 12;

    const drawSection = (title: string, details: any[], total: number, totalLabel: string, head: string[][], bodyKeys: string[]) => {
        // Pre-emptive check for space before starting a new section
        if (yPos > pageHeight - 40) { 
            pdf.addPage();
            yPos = 22;
        }
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, leftMargin, yPos);
        yPos += 8;
        
        autoTable(pdf, {
            startY: yPos,
            head: head,
            body: details.map(item => bodyKeys.map(key => {
                if (key === 'total_amount' || key === 'total_cost') {
                    return `$${(item[key] || 0).toFixed(2)}`;
                }
                return item[key];
            })),
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 2 },
            headStyles: { fillColor: [41, 128, 185], fontSize: 11 },
        });

        yPos = (pdf as any).lastAutoTable.finalY;

        // Check for space *after* the table and before printing the total
        if (yPos > pageHeight - 25) {
            pdf.addPage();
            yPos = 22;
        }
        
        yPos += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.text(totalLabel, leftMargin, yPos);
        pdf.text(`$${total.toFixed(2)}`, rightMargin, yPos, { align: 'right' });
        yPos += 12;
    };

    drawSection('Revenue', data.revenueDetails, data.totalRevenue, 'Total Revenue', [['Description', 'Amount']], ['description', 'total_amount']);
    drawSection('Cost of Goods Sold', data.cogsDetails, data.totalCOGS, 'Total COGS', [['Item', 'Cost']], ['item_name', 'total_cost']);
    
    // -- Gross Profit --
    if (yPos > pageHeight - 30) { pdf.addPage(); yPos = 22; }
    pdf.setFont('helvetica', 'bold');
    pdf.text('Gross Profit', leftMargin, yPos);
    pdf.text(`$${data.grossProfit.toFixed(2)}`, rightMargin, yPos, { align: 'right' });
    yPos += 15;

    drawSection('Operating Expenses', data.operatingExpenseDetails, data.totalOperatingExpenses, 'Total Operating Expenses', [['Category', 'Amount']], ['category', 'total_amount']);

    // -- Net Profit --
    if (yPos > pageHeight - 30) { pdf.addPage(); yPos = 22; }
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Net Profit', leftMargin, yPos);
    pdf.text(`$${data.netProfit.toFixed(2)}`, rightMargin, yPos, { align: 'right' });

    // -- Footer --
    const pageCount = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const isFirstPage = i === 1;
        const footerY = pageHeight - 15;
        
        pdf.setFontSize(9);
        pdf.text(`Page ${i} of ${pageCount}`, leftMargin, footerY + 5, { align: 'left' });
        
        const footerText = `${shopInfo?.shop_name || 'MotorMinds'} | ${shopInfo?.shop_address || ''} | ${shopInfo?.shop_phone || ''}`;
        pdf.text(footerText, rightMargin, footerY + 5, { align: 'right' });
    }
    
    const startStr = new Date(data.startDate).toLocaleDateString('en-CA');
    const endStr = new Date(data.endDate).toLocaleDateString('en-CA');
    pdf.save(`Income_Statement_${statementId ?? 'draft'}_${startStr}_to_${endStr}.pdf`);
}; 