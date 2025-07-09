import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Service } from "../types"; // Assuming you'll create a types file

export function useServices(shopId: string | null) {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchServices = useCallback(async () => {
        if (!shopId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("shop_services")
                .select("*")
                .eq("shop_id", shopId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error("Error fetching services:", error);
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    }, [shopId]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const addService = async (service: Partial<Service>) => {
        if (!shopId) return null;

        try {
            const { data, error } = await supabase
                .from("shop_services")
                .insert([{ ...service, shop_id: shopId }])
                .select()
                .single();

            if (error) throw error;
            
            setServices(prev => [data, ...prev]);
            return data;
        } catch (error) {
            console.error("Error adding service:", error);
            return null;
        }
    };

    const updateService = async (id: string, updates: Partial<Service>) => {
        try {
            const { data, error } = await supabase
                .from("shop_services")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;

            setServices(prev => prev.map(s => (s.id === id ? data : s)));
            return data;
        } catch (error) {
            console.error("Error updating service:", error);
            return null;
        }
    };

    const deleteService = async (id: string) => {
        try {
            const { error } = await supabase.from("shop_services").delete().eq("id", id);
            if (error) throw error;
            
            setServices(prev => prev.filter(service => service.id !== id));
            return true;
        } catch (error) {
            console.error("Error deleting service:", error);
            return false;
        }
    };

    return { services, setServices, isLoading, fetchServices, addService, updateService, deleteService };
} 