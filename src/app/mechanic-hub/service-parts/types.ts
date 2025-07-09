export interface Service {
    id: string;
    shop_id: string;
    service_name: string;
    description: string;
    price: number;
    cost?: number | null;
    quantity: number;
    type: "labor" | "parts";
    created_at: string;
} 