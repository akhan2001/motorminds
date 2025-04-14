// src/app/invoices/components/invoice-calendar.tsx
import React, { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

interface InvoiceCalendarProps {
  invoices: any[];
  selectedDate: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}

export function InvoiceCalendar({
  invoices,
  selectedDate,
  onSelect,
  className = "",
}: InvoiceCalendarProps) {
  // Create a mapping of dates to invoice counts
  const invoiceDateMap = useMemo(() => {
    const dateMap: Record<string, number> = {};
    
    invoices.forEach(invoice => {
      const dateKey = format(new Date(invoice.issue_date), "yyyy-MM-dd");
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    });
    
    return dateMap;
  }, [invoices]);

  // Create a CSS overlay for the calendar
  const overlayStyles = useMemo(() => {
    let styles = '';
    
    Object.entries(invoiceDateMap).forEach(([dateKey, count]) => {
      const [year, month, day] = dateKey.split('-').map(Number);
      // CSS selector targeting specific date buttons - may need adjustment based on your calendar DOM structure
      styles += `
        .rdp-day[aria-label*="${month}/${day}/${year}"]::after {
          content: '';
          position: absolute;
          top: 2px;
          right: 2px;
          width: 6px;
          height: 6px;
          background-color: #ef4444;
          border-radius: 50%;
          display: block;
        }
      `;
    });
    
    return styles;
  }, [invoiceDateMap]);

  return (
    <>
      <style>{overlayStyles}</style>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(day) => onSelect(day || new Date())}
        initialFocus
        className={`bg-[#131313] ${className}`}
      />
    </>
  );
}