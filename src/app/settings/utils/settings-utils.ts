import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Uploads a shop logo to Supabase storage following RLS policies
 * @param file - The image file to upload
 * @param shopId - The ID of the shop
 * @returns The URL of the uploaded image, or null if upload failed
 */
export const uploadShopLogo = async (file: File, shopId: string): Promise<string | null> => {
  const supabase = createClientComponentClient();
  
  if (!file) return null;
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    toast.error("Logo file must be less than 5MB");
    return null;
  }
  
  try {
    // Get the current authenticated user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to upload files");
      return null;
    }
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    // Create path with user ID as the first folder segment to comply with RLS
    const filePath = `${user.id}/shop_logos/${fileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('motorminds')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (error) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('motorminds')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Error uploading logo:", error);
    toast.error(`Upload failed: ${error.message || "Unknown error"}`);
    return null;
  }
};

/**
 * Deletes a shop logo from Supabase storage
 * @param logoUrl - The URL of the logo to delete
 * @returns Boolean indicating success or failure
 */
export const deleteShopLogo = async (logoUrl: string): Promise<boolean> => {
  const supabase = createClientComponentClient();
  
  try {
    // Extract the file path from the URL
    // The URL format is https://zjkdltcpjzyzisbgznyj.supabase.co/storage/v1/object/public/motorminds/shop_logos/filename
    const parts = logoUrl.split('/public/motorminds/');
    if (parts.length < 2) return false;
    
    const filePath = parts[1];
    
    const { error } = await supabase
      .storage
      .from('motorminds')
      .remove([filePath]);
      
    if (error) {
      console.error("Delete error:", error);
      toast.error(`Delete failed: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error("Error deleting logo:", error);
    toast.error(`Delete failed: ${error.message || "Unknown error"}`);
    return false;
  }
};
