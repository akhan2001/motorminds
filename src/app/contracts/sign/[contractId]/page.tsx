'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { DocusealForm } from '@docuseal/react';
import { markContractViewed, markContractCompleted, markContractDeclined } from '@/app/customer-contracts/utils/contract-utils';
import { config } from '@/lib/config';

interface Contract {
    id: string;
    title: string;
    customer: {
        customer_name: string;
        customer_email: string;
    } | null;
    vehicle: {
        year: string;
        make: string;
        model: string;
    } | null;
    shops: {
        shop_name: string;
        shop_address: string;
        shop_phone: string;
        shop_email: string;
    } | null;
}

export default function ContractSigningPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const contractId = params?.contractId as string;
    const submissionSlug = searchParams?.get('slug'); // Changed from template to slug
    
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signingComplete, setSigningComplete] = useState(false);

    useEffect(() => {
        async function loadContract() {
            if (!contractId) {
                setError('Contract ID is required');
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('service_contracts')
                    .select(`
                        id,
                        title,
                        customer:customers!inner (customer_name, customer_email),
                        vehicle:customer_vehicles (year, make, model),
                        shops!inner (shop_name, shop_address, shop_phone, shop_email)
                    `)
                    .eq('id', contractId)
                    .single();

                if (error) throw error;
                
                // Transform the array results to single objects
                const transformedContract: Contract = {
                    id: data.id,
                    title: data.title,
                    customer: Array.isArray(data.customer) && data.customer.length > 0 ? data.customer[0] : null,
                    vehicle: Array.isArray(data.vehicle) && data.vehicle.length > 0 ? data.vehicle[0] : null,
                    shops: Array.isArray(data.shops) && data.shops.length > 0 ? data.shops[0] : null
                };
                
                setContract(transformedContract);
                
                // Mark as viewed when customer loads the page
                await markContractViewed(contractId);
            } catch (error) {
                console.error('Error loading contract:', error);
                setError('Contract not found or access denied');
            } finally {
                setLoading(false);
            }
        }

        loadContract();
    }, [contractId]);

    const handleCompleted = async (data: any) => {
        console.log('Contract signed:', data);
        await markContractCompleted(contractId, data);
        setSigningComplete(true);
    };

    const handleDeclined = async (data: any) => {
        console.log('Contract declined:', data);
        await markContractDeclined(contractId, data);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading contract...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6">
                        <p className="text-gray-700">Contract not found.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (signingComplete) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-green-600">Contract Signed!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 mb-4">
                            Thank you for signing your service contract. You will receive a copy via email shortly.
                        </p>
                        <div className="text-sm text-gray-600">
                            <p><strong>Contract:</strong> {contract.title}</p>
                            <p><strong>Shop:</strong> {contract.shops?.shop_name}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!submissionSlug) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6">
                        <p className="text-gray-700">Invalid signing link. Please contact the shop for assistance.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                {/* Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Service Contract Signature
                        </CardTitle>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>From:</strong> {contract.shops?.shop_name}</p>
                            <p><strong>Contract:</strong> {contract.title}</p>
                            {contract.customer && (
                                <p><strong>Customer:</strong> {contract.customer.customer_name}</p>
                            )}
                            {contract.vehicle && (
                                <p><strong>Vehicle:</strong> {contract.vehicle.year} {contract.vehicle.make} {contract.vehicle.model}</p>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* DocuSeal Form Container */}
                <Card>
                    <CardContent className="p-0">
                        <div className="w-full" style={{ height: '80vh' }}>
                            <DocusealForm
                                src={`${config.docuseal.baseUrl}/s/${submissionSlug}`}
                                onComplete={handleCompleted}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 