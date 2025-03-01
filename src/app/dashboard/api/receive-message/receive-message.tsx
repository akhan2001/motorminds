import { supabase } from "@/lib/supabase";

export async function getMessages(shop_id: string) {
    try {
        const { data } = await supabase.from('messages').select('*').eq('shop_id', shop_id);
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}
