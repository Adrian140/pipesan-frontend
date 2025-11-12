import { supabase } from '../config/supabase';

export const uploadLogo = async (file) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size must be less than 2MB');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `logo/pipesan-logo.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        upsert: true // Replace existing logo
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
 } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
};

export const deleteLogo = async () => {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove(['logo/pipesan-logo.png', 'logo/pipesan-logo.jpg', 'logo/pipesan-logo.webp']);
    
    if (error) throw error;
    
    return true;
 } catch (error) {
    console.error('Error deleting logo:', error);
    throw error;
  }
};
