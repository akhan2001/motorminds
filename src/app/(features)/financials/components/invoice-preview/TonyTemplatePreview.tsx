'use client'

import React from 'react'
import type { InvoicePDFData } from '../../types/invoice-pdf'

export const TonyTemplatePreview: React.FC<InvoicePDFData> = ({ invoice, shop }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    // Calculate totals - only active items
    const activeItems = invoice.invoice_items.filter(item => (item as any).active !== false)
    
    // Calculate subtotal - discounts subtract from subtotal, all other items add
    const subtotal = activeItems.reduce((sum, item) => {
        if ((item as any).item_type === 'discount') {
            return sum - item.total_price
        }
        return sum + item.total_price
    }, 0)

    // Calculate tax - tax_rate can be 0 or null if tax is disabled
    const taxRate = invoice.tax_rate ?? 0
    const taxAmount = taxRate > 0 ? subtotal * taxRate : 0
    
    // Get discount amount from invoice (separate from discount items)
    const discountAmount = invoice.discount_amount || 0
    
    // Calculate total: subtotal + tax - discount
    const total = subtotal + taxAmount - discountAmount

    // Create empty rows to fill the table (max 20 rows)  
    const maxRows = 20
    const rowsToShow = Math.min(activeItems.length, maxRows)
    const emptyRowsNeeded = Math.max(0, maxRows - rowsToShow)
    const emptyRows = Array(emptyRowsNeeded).fill(null)
    const displayedItems = activeItems.slice(0, maxRows)

    return (
        <div
            className="bg-white text-gray-900 h-full flex flex-col"
            style={{
                fontSize: '10pt',
                fontFamily: 'Helvetica, Arial, sans-serif',
                height: '100%'
            }}
        >
            {/* TOP SECTION - Grid Layout */}
            <div className="mb-0.5 flex-shrink-0">
                {/* Row 1: Logo | Empty | Tagline+Address | Business Info */}
                <div className="flex items-center min-h-[40px] px-1.5 py-1">
                    <div className="w-[33%] pl-0.5 bg-white flex items-center justify-start py-1 px-1">
                        <img 
                            src="/client_logos/good_guyz/good-guyz-garage_logo.png" 
                            alt="Good Guyz Garage Logo" 
                            className="max-w-full max-h-[100px] object-contain"
                        />
                    </div>
                    <div className="w-[33%] px-1 flex flex-col text-center">
                        <div className="text-blue-900 text-[11pt] italic mb-0.5">"By Name. By Reputation."</div>
                        <div className="text-blue-900 text-[11pt] leading-tight font-bold">
                            75 LODGE ST.,<br />
                            WATERLOO, ON N2J 2V5<br />
                            (519) 885-1321
                        </div>
                    </div>
                    <div className="w-[30%] text-left text-blue-900 pl-1">
                        <div className="text-[8pt] font-bold mb-0.5">BUSINESS NO.: {shop?.business_number || '894510635RT'}</div>
                        <div className="text-[8pt]">INVOICE NO.: {invoice.display_id || invoice.invoice_number}</div>
                        <div className="text-[8pt]">DATE: {formatDate(invoice.issue_date)}</div>
                    </div>
                </div>

                {/* Row 2: Customer | Vehicle | Payment Method - Horizontal Format */}
                <div className="flex p-1.5">
                    <div className="w-[40%] pr-2">
                        <div className="text-[10pt] text-blue-900 mb-1 uppercase">Customer Information</div>
                        <div className="flex flex-row">
                            <span className="text-[10pt] text-blue-900">CUSTOMER NAME:</span>
                            <span className="text-[10pt] text-blue-900 flex-1 min-h-[12px]">{invoice.customer?.customer_name || ''}</span>
                        </div>
                        <div className="flex flex-row">
                            <span className="text-[10pt] text-blue-900">ADDRESS:</span>
                            <span className="text-[10pt] text-blue-900 flex-1 min-h-[12px]">{invoice.customer?.customer_address || ''}</span>
                        </div>
                        <div className="flex flex-row">
                            <span className="text-[10pt] text-blue-900">CITY, PROV:</span>
                            <span className="text-[10pt] text-blue-900 flex-1 min-h-[12px]"></span>
                        </div>
                        <div className="flex flex-row">
                            <span className="text-[10pt] text-blue-900">POSTAL CODE:</span>
                            <span className="text-[10pt] text-blue-900 flex-1 min-h-[12px]"></span>
                        </div>
                        <div className="flex flex-row">
                            <span className="text-[10pt] text-blue-900">TELEPHONE:</span>
                            <span className="text-[10pt] text-blue-900 flex-1 min-h-[12px]">{invoice.customer?.customer_phone || ''}</span>
                        </div>
                    </div>

                    <div className="w-[35%] px-2">
                        <div className="flex flex-col">
                            <div className="text-[10pt] text-blue-900 mb-1 uppercase">Vehicle Information</div>
                            <div className="flex flex-row">
                                <span className="text-[10pt] text-blue-900">MAKE:</span>
                                <span className="text-[10pt] text-blue-900"> {invoice.vehicle?.make || ''}</span>
                            </div>
                            <div className="flex flex-row">
                                <span className="text-[10pt] text-blue-900">MODEL:</span>
                                <span className="text-[10pt] text-blue-900"> {invoice.vehicle?.model || ''}</span>
                            </div>
                            <div className="flex flex-row">
                                <span className="text-[10pt] text-blue-900">YEAR:</span>
                                <span className="text-[10pt] text-blue-900"> {invoice.vehicle?.year || ''}</span>
                            </div>
                            <div className="flex flex-row">
                                <span className="text-[10pt] text-blue-900">PLATE:</span>
                                <span className="text-[10pt] text-blue-900"> {invoice.vehicle?.license_plate || ''}</span>
                            </div>
                            <div className="flex flex-row">
                                <span className="text-[10pt] text-blue-900">ODOMETER:</span>
                                {/* <span className="text-[8pt] text-blue-900">{invoice.mileage || ''}</span> */}
                            </div>
                        </div>
                    </div>

                    <div className="w-[25%] pl-2">
                        <div className="text-[10pt] text-blue-900 mb-1 uppercase">
                            Method of Payment
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10pt] text-blue-900">☐     Cash</span>
                            <span className="text-[10pt] text-blue-900">☐     Charge</span>
                            <span className="text-[10pt] text-blue-900">☐     Debit</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canadian Owned Banner */}
            <div className="text-center py-0.5 mb-1 flex-shrink-0">
                <span className="text-[8pt] font-bold text-blue-900">
                    <span className="text-[#e53e3e] text-[10pt] mr-0.5">🍁</span>
                    100% CANADIAN OWNED & OPERATED!
                </span>
            </div>

            {/* MIDDLE SECTION - Items Table */}
            <div className="flex-1 mb-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col mb-1">
                    {/* Table */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '12%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '48%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-indigo-200 border border-indigo-300">
                                    <th className="text-center text-blue-900 text-[10pt] font-bold p-1 border-r border-indigo-300">Item No.</th>
                                    <th className="text-center text-blue-900 text-[10pt] font-bold p-1 border-r border-indigo-300">Quantity</th>
                                    <th className="text-center text-blue-900 text-[10pt] font-bold p-1 border-r border-indigo-300">Description</th>
                                    <th className="text-center text-blue-900 text-[10pt] font-bold p-1 border-r border-indigo-300">Unit Price</th>
                                    <th className="text-center text-blue-900 text-[10pt] font-bold p-1">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Invoice Items */}
                                {displayedItems.map((item, index) => (
                                    <tr key={item.id} className="border-l border-r border-[#cbd5e0]" style={{ height: '20px' }}>
                                        <td className="text-center text-[10pt] text-blue-900 px-0.5 py-0.5 border-r border-[#cbd5e0]">{item.item_type || ''}</td>
                                        <td className="text-center text-[10pt] text-blue-900 px-0.5 py-0.5 border-r border-[#cbd5e0]">{item.item_type === 'labor' ? item.labor_hours || item.quantity : item.quantity}</td>
                                        <td className="text-left text-[10pt] text-blue-900 py-0.5 px-2 border-r border-[#cbd5e0]">
                                            {item.description}
                                        </td>
                                        <td className="text-center text-[10pt] text-blue-900 px-0.5 py-0.5 border-r border-[#cbd5e0]">
                                            {/* If item is discount show - in red */}
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="text-center text-[10pt] text-blue-900 px-0.5 py-0.5">
                                            {item.item_type === 'discount' ? <span className="text-red-600">-{formatCurrency(item.total_price)}</span> : formatCurrency(item.total_price)}
                                        </td>
                                    </tr>
                                ))}

                                {/* Empty Rows */}
                                {emptyRows.map((_, index) => (
                                    <tr key={`empty-${index}`} className="border-l border-r border-[#cbd5e0]" style={{ height: '20px' }}>
                                        <td className="text-center text-[8pt] px-0.5 py-0.5 border-r border-[#cbd5e0]"></td>
                                        <td className="text-center text-[8pt] px-0.5 py-0.5 border-r border-[#cbd5e0]"></td>
                                        <td className="text-left text-[8pt] px-0.5 py-0.5 border-r border-[#cbd5e0]"></td>
                                        <td className="text-center text-[8pt] px-0.5 py-0.5 border-r border-[#cbd5e0]"></td>
                                        <td className="text-center text-[8pt] px-0.5 py-0.5"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Unified Grid Layout - Comments, Totals, Invoice Comments, and Signature */}
                <div className="grid grid-rows-[auto_auto_auto] grid-cols-[70%_30%] gap-1 mt-1 flex-shrink-0">
                    {/* Row 1: Comments */}
                    <div className="row-span-1">
                        <div className="border border-[#cbd5e0] h-full p-1.5 flex flex-col">
                            <div className="text-[8pt] font-bold text-blue-900 mb-1">COMMENTS</div>
                            <div className="text-[10pt] text-blue-900 leading-tight whitespace-pre-wrap flex-1">{invoice.description || ''}</div>
                        </div>
                    </div>
                    {/* Row 1: Totals */}
                    <div className="row-span-1">
                        <div className="border border-[#cbd5e0] h-full flex flex-col">
                            <div className="flex justify-between p-1.5 border-b border-[#cbd5e0]">
                                <span className="text-[9pt] font-bold text-blue-900">SUBTOTAL</span>
                                <span className="text-[10pt] font-bold text-blue-900">{formatCurrency(subtotal)}</span>
                            </div>
                            {taxRate > 0 && (
                                <div className="flex justify-between p-1.5 border-b border-[#cbd5e0]">
                                    <span className="text-[9pt] font-bold text-blue-900">TAX (HST)</span>
                                    <span className="text-[10pt] font-bold text-blue-900">{formatCurrency(taxAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between p-1.5 flex-1 bg-indigo-200">
                                <span className="text-[9pt] font-bold text-blue-900 ">TOTAL</span>
                                <span className="text-[10pt] font-bold text-blue-900">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                    {/* Row 2: Invoice Comments - Full Width */}
                    <div className="col-span-2 row-span-1">
                        <div className="p-1.5 border border-[#cbd5e0]">
                            <div className="text-[9pt] text-blue-900 leading-tight italic mb-1">
                                INVOICE COMMENTS: ALL WHEELS THAT ARE REMOVED ARE HAND TORQUED TO MANUFACTURER'S SPECIFICATIONS & SHOULD BE RE-TORQUED AFTER APPROXIMATELY 100KM.
                            </div>
                            <div className="text-[8pt] text-blue-900 leading-tight">
                                I hereby authorize the above work to be completed along with necessary materials as permitted by law. Good Guyz Garage Inc. is not held responsible for any delays caused by delayed delivery of parts or materials required to complete the above repairs. I hereby authorize Good Guyz Garage Inc. and its employees to test drive my vehicle for the purpose of testing and/or inspection.
                            </div>
                            <div className="text-[8pt] text-blue-900 leading-tight">
                                I understand that the loss of theft of service or theft while left in the above. Good Guyz Garage Inc. cannot be held responsible for any delays caused by delayed delivery of parts or materials required to complete the above repairs. I acknowledge my indebtedness to Good Guyz Garage Inc. and the existence of a lien payment in full is received for the above charges. I acknowledge my indebtedness to Good Guyz Garage Inc. and the existence of a lien upon my vehicle in the amount listed above including, but not limited to labour costs, part costs, taxes, court costs and storage etc.
                            </div>
                            <div className="text-[8pt] text-blue-900 leading-tight">
                                I further acknowledge that the said lien shall continue at all times, whether the vehicle is in my possession or that of Good Guyz Garage Inc.
                            </div>
                            {/* Row 3: Signature and Date - 4 Column Grid */}
                            <div className="col-span-2 row-span-1 grid grid-cols-[auto_50%_auto_1fr] gap-0 items-end">
                                <div className="pb-0.5">
                                    <div className="text-[8pt] text-blue-900 text-center mt-1">Customer Acceptance</div>
                                </div>
                                <div className="border-b border-[#2d3748] pb-0.5"></div>
                                <div className="pb-0.5">
                                    <div className="text-[8pt] text-blue-900 text-center mt-1">Date</div>
                                </div>
                                <div className="border-b border-[#2d3748] pb-0.5"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

