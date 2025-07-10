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

    // Header
    pdf.setFontSize(20);
    pdf.text(shopInfo?.shop_name || 'MotorMinds Auto Shop', 14, 22);
    pdf.setFontSize(16);
    pdf.text(`Income Statement (${statementId ?? 'Draft'})`, 14, 32);
    pdf.setFontSize(10);
    pdf.text(`For the period from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}`, 14, 40);

    let yPos = 50;

    // Revenue
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Revenue', 14, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    autoTable(pdf, {
        startY: yPos,
        head: [['Description', 'Amount']],
        body: data.revenueDetails.map(item => [item.description, `$${item.total_amount.toFixed(2)}`]),
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], fontSize: 12 },
        didDrawPage: () => {}
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Revenue', 14, yPos);
    pdf.text(`$${data.totalRevenue.toFixed(2)}`, 180, yPos);
    yPos += 10;

    // Cost of Goods Sold (COGS)
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cost of Goods Sold', 14, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    autoTable(pdf, {
        startY: yPos,
        head: [['Item', 'Cost']],
        body: data.cogsDetails.map(item => [item.item_name, `$${item.total_cost.toFixed(2)}`]),
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], fontSize: 12 },
        didDrawPage: () => {}
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total COGS', 14, yPos);
    pdf.text(`$${data.totalCOGS.toFixed(2)}`, 180, yPos);
    yPos += 10;

    // Gross Profit
    pdf.setFont('helvetica', 'bold');
    pdf.text('Gross Profit', 14, yPos);
    pdf.text(`$${data.grossProfit.toFixed(2)}`, 180, yPos);
    yPos += 15;

    // Operating Expenses
    pdf.setFont('helvetica', 'bold');
    pdf.text('Operating Expenses', 14, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    autoTable(pdf, {
        startY: yPos,
        head: [['Category', 'Amount']],
        body: data.operatingExpenseDetails.map(item => [item.category, `$${item.total_amount.toFixed(2)}`]),
        theme: 'striped',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], fontSize: 12 },
        didDrawPage: () => {}
    });

    yPos = (pdf as any).lastAutoTable.finalY + 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Operating Expenses', 14, yPos);
    pdf.text(`$${data.totalOperatingExpenses.toFixed(2)}`, 180, yPos);
    yPos += 10;

    // Net Profit
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Net Profit', 14, yPos);
    pdf.text(`$${data.netProfit.toFixed(2)}`, 180, yPos);

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(`Page ${i} of ${pageCount}`, 14, pdf.internal.pageSize.height - 10);
        pdf.text(`${shopInfo?.shop_name || 'MotorMinds'} | ${shopInfo?.shop_address || ''} | ${shopInfo?.shop_phone || ''}`, pdf.internal.pageSize.width - 14, pdf.internal.pageSize.height - 10, { align: 'right' });
    }

    const startStr = new Date(data.startDate).toLocaleDateString('en-CA');
    const endStr = new Date(data.endDate).toLocaleDateString('en-CA');
    pdf.save(`Income_Statement_${statementId ?? 'draft'}_${startStr}_to_${endStr}.pdf`);
}; 