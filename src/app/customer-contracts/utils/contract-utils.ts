import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { OpenAI } from "openai";

// WARNING: Storing and using the OpenAI API key on the client-side is insecure.
// This is for demonstration purposes only and should be moved to a secure
// server-side API route in a production environment.


export async function fetchAllContracts(shopId: string) {
    if (!shopId) return [];
    const { data, error } = await supabase
        .from('service_contracts')
        .select(`
            id, 
            title, 
            content,
            status, 
            created_at, 
            customer_id,
            signature_status,
            signature_completed_at,
            signature_requested_at,
            signed_document_url,
            docuseal_submission_id,
            customer:customers (id, customer_name, customer_email, customer_phone, customer_address), 
            vehicle:customer_vehicles (id, make, model, year, vin)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

    if (error) {
        toast.error("Failed to fetch contracts.");
        console.error("Failed to fetch contracts:", JSON.stringify(error, null, 2));
        return [];
    }
    return data;
}

export async function fetchShopDetails(shopId: string) {
    if (!shopId) return null;
    const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

    if (error) {
        toast.error("Failed to fetch shop details.");
        console.error(error);
        return null;
    }
    return data;
}

export async function createContract(contractData: any) {
    const { data, error } = await supabase.from('service_contracts').insert(contractData).select().single();
    if (error) {
        toast.error("Failed to create contract.");
        console.error(error);
        return null;
    }
    toast.success("Contract created successfully!");
    return data;
}

export async function updateContract(contractId: string, contractData: any) {
    const { data, error } = await supabase.from('service_contracts').update(contractData).eq('id', contractId).select().single();
    if (error) {
        toast.error("Failed to update contract.");
        console.error(error);
        return null;
    }
    toast.success("Contract updated successfully!");
    return data;
}

export async function deleteContract(contractId: string) {
    const { error } = await supabase.from('service_contracts').delete().eq('id', contractId);
    if (error) {
        toast.error("Failed to delete contract.");
        console.error(error);
        return false;
    }
    toast.success("Contract deleted successfully!");
    return true;
}

export async function updateContractStatus(contractId: string, status: string) {
    const { data, error } = await supabase
        .from('service_contracts')
        .update({ status })
        .eq('id', contractId)
        .select()
        .single();

    if (error) {
        toast.error("Failed to update contract status.");
        console.error(error);
        return null;
    }
    toast.success("Contract status updated successfully!");
    return data;
}

export async function updateSignatureStatus(contractId: string, signatureStatus: string, additionalData?: any) {
    const updateData: any = { 
        signature_status: signatureStatus 
    };

    if (signatureStatus === 'completed') {
        updateData.signature_completed_at = new Date().toISOString();
        if (additionalData?.submission_id) {
            updateData.docuseal_submission_id = additionalData.submission_id;
        }
        if (additionalData?.download_url) {
            updateData.signed_document_url = additionalData.download_url;
        }
    }

    const { data, error } = await supabase
        .from('service_contracts')
        .update(updateData)
        .eq('id', contractId)
        .select()
        .single();

    if (error) {
        toast.error("Failed to update signature status.");
        console.error(error);
        return null;
    }

    return data;
}

export async function logSignatureEvent(contractId: string, eventType: string, eventData?: any) {
    const { error } = await supabase
        .from('contract_signature_events')
        .insert({
            contract_id: contractId,
            event_type: eventType,
            event_data: eventData || {}
        });

    if (error) {
        console.error("Failed to log signature event:", error);
        return false;
    }
    return true;
}

export async function markContractViewed(contractId: string) {
    try {
        await updateSignatureStatus(contractId, 'viewed');
        await logSignatureEvent(contractId, 'viewed');
        return true;
    } catch (error) {
        console.error("Error marking contract as viewed:", error);
        return false;
    }
}

export async function markContractCompleted(contractId: string, completionData: any) {
    try {
        await updateSignatureStatus(contractId, 'completed', {
            submission_id: completionData.submission_id || completionData.id,
            download_url: completionData.download_url
        });
        await logSignatureEvent(contractId, 'completed', completionData);
        toast.success("Contract signed successfully!");
        return true;
    } catch (error) {
        console.error("Error marking contract as completed:", error);
        toast.error("Failed to update contract status");
        return false;
    }
}

export async function markContractDeclined(contractId: string, declineData?: any) {
    try {
        await updateSignatureStatus(contractId, 'declined');
        await logSignatureEvent(contractId, 'declined', declineData);
        toast.info("Contract was declined");
        return true;
    } catch (error) {
        console.error("Error marking contract as declined:", error);
        toast.error("Failed to update contract status");
        return false;
    }
}

export async function sendContractForSignature(contractId: string) {
    try {
        // Update status to 'sent'
        await updateSignatureStatus(contractId, 'sent');
        
        // Update the signature_requested_at timestamp
        await supabase
            .from('service_contracts')
            .update({ signature_requested_at: new Date().toISOString() })
            .eq('id', contractId);

        // Log the event
        await logSignatureEvent(contractId, 'sent');

        toast.success("Contract sent for signature!");
        return true;
    } catch (error) {
        console.error("Error sending contract for signature:", error);
        toast.error("Failed to send contract for signature");
        return false;
    }
}

export async function checkSignatureStatus(contractId: string) {
    try {
        const { data, error } = await supabase
            .from('service_contracts')
            .select('signature_status, docuseal_submission_id, signature_completed_at, signed_document_url')
            .eq('id', contractId)
            .single();

        if (error) throw error;

        return {
            status: data.signature_status,
            submissionId: data.docuseal_submission_id,
            completedAt: data.signature_completed_at,
            signedDocumentUrl: data.signed_document_url
        };
    } catch (error) {
        console.error("Error checking signature status:", error);
        return { 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        };
    }
}

export async function getContractSignatureEvents(contractId: string) {
    try {
        const { data, error } = await supabase
            .from('contract_signature_events')
            .select('*')
            .eq('contract_id', contractId)
            .order('occurred_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching signature events:", error);
        return [];
    }
}