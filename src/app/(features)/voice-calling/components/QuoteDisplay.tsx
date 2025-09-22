'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
    CheckCircle, 
    Clock, 
    XCircle, 
    DollarSign, 
    Package, 
    Calendar,
    Phone,
    User
} from 'lucide-react'

interface QuoteData {
    supplier_name: string
    contact_person?: string
    supplier_reference?: string
    quote_date: string
    parts: Array<{
        part_name: string
        part_number?: string
        quantity: number
        supplier_part_number?: string
        availability: 'in_stock' | 'backorder' | 'discontinued' | 'unknown'
        cost_price?: number
        retail_price?: number
        delivery_days?: number
        eta?: string
        notes?: string
    }>
    total_quote: number
    call_notes?: string
    quote_valid_until?: string
}

interface QuoteDisplayProps {
    quote: QuoteData
    className?: string
}

export default function QuoteDisplay({ quote, className = '' }: QuoteDisplayProps) {
    const getAvailabilityIcon = (availability: string) => {
        switch (availability) {
            case 'in_stock':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'backorder':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'discontinued':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <Package className="h-4 w-4 text-gray-500" />
        }
    }

    const getAvailabilityColor = (availability: string) => {
        switch (availability) {
            case 'in_stock':
                return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'backorder':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            case 'discontinued':
                return 'bg-red-500/20 text-red-400 border-red-500/30'
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    return (
        <Card className={`bg-[#111111] border-[#2a2a2a] ${className}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-white flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-400" />
                            Quote from {quote.supplier_name}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(quote.quote_date)}
                            </div>
                            {quote.contact_person && (
                                <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    {quote.contact_person}
                                </div>
                            )}
                            {quote.supplier_reference && (
                                <div className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    Ref: {quote.supplier_reference}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                            {formatCurrency(quote.total_quote)}
                        </div>
                        <div className="text-sm text-gray-400">Total Quote</div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Parts List */}
                <div className="space-y-3">
                    <h4 className="text-white font-medium flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Parts Breakdown
                    </h4>
                    
                    {quote.parts.map((part, index) => (
                        <div key={index} className="bg-gray-900 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h5 className="text-white font-medium">{part.part_name}</h5>
                                        <Badge className={`${getAvailabilityColor(part.availability)} border`}>
                                            <span className="flex items-center gap-1">
                                                {getAvailabilityIcon(part.availability)}
                                                {part.availability.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-400">
                                        {part.part_number && (
                                            <div>
                                                <span className="text-gray-500">Part #:</span><br />
                                                <span className="text-gray-300">{part.part_number}</span>
                                            </div>
                                        )}
                                        {part.supplier_part_number && (
                                            <div>
                                                <span className="text-gray-500">Supplier #:</span><br />
                                                <span className="text-gray-300">{part.supplier_part_number}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500">Quantity:</span><br />
                                            <span className="text-gray-300">{part.quantity}</span>
                                        </div>
                                        {part.delivery_days !== undefined && (
                                            <div>
                                                <span className="text-gray-500">Delivery:</span><br />
                                                <span className="text-gray-300">
                                                    {part.delivery_days} business days
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {part.notes && (
                                        <div className="mt-2 text-sm text-gray-400">
                                            <span className="text-gray-500">Notes:</span> {part.notes}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-right ml-4">
                                    {part.cost_price && (
                                        <div className="text-lg font-semibold text-white">
                                            {formatCurrency(part.cost_price)}
                                        </div>
                                    )}
                                    {part.retail_price && part.retail_price !== part.cost_price && (
                                        <div className="text-sm text-gray-400 line-through">
                                            {formatCurrency(part.retail_price)}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500">each</div>
                                    {part.quantity > 1 && part.cost_price && (
                                        <div className="text-sm text-gray-300 mt-1">
                                            {formatCurrency(part.cost_price * part.quantity)} total
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call Notes */}
                {quote.call_notes && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                        <h5 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Call Notes
                        </h5>
                        <p className="text-gray-300 text-sm">{quote.call_notes}</p>
                    </div>
                )}

                {/* Quote Validity */}
                {quote.quote_valid_until && (
                    <div className="text-center text-sm text-gray-400 border-t border-gray-700 pt-3">
                        Quote valid until: {formatDate(quote.quote_valid_until)}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
