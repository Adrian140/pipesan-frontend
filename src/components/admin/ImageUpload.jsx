import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Star, AlertTriangle } from 'lucide-react';
    import { uploadProductImage, deleteImage } from '../../config/supabase'; // Assuming these are correctly implemented
function ImageUpload({ productId, images = [], onImagesChange, maxImages = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Show disabled notice

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    setUploading(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large (max 5MB)`);
        }
        
        const imageUrl = await uploadProductImage(file, productId || 'temp');
        return {
          id: Date.now() + Math.random(),
          url: imageUrl,
           alt: file.name.split('.')[0], // Default alt text
         isPrimary: images.length === 0 // First image is primary
        };
      });
      
      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages]);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = async (imageIndex) => {
    const imageToRemove = images[imageIndex];
    
     try { // Only attempt to delete from storage if it's an existing image (not a new upload that hasn't been saved yet)
     await deleteImage(imageToRemove.url);
      const updatedImages = images.filter((_, index) => index !== imageIndex);
      
      // If we removed the primary image, make the first remaining image primary
      if (imageToRemove.isPrimary && updatedImages.length > 0) {
        updatedImages[0].isPrimary = true;
      }
      
      onImagesChange(updatedImages);
    } catch (error) {
      console.error('Error removing image:', error);
      alert('Failed to remove image');
    }
  };

  const setPrimaryImage = (imageIndex) => {
    const updatedImages = images.map((img, index) => ({
      ...img,
      isPrimary: index === imageIndex
    }));
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-text-primary">
        Imagini produs ({images.length}/{maxImages})
      </label>
      
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {uploading ? 'Se încarcă...' : 'Încarcă imagini'}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop sau click pentru a selecta imagini
            </p>
            <p className="text-xs text-gray-400 mt-2">
              PNG, JPG, WEBP până la 5MB
            </p>
          </label>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Image Controls */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="flex space-x-2">
                  {!image.isPrimary && (
                    <button
                      onClick={() => setPrimaryImage(index)}
                      className="bg-white text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Set as primary image"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Se încarcă imaginile...</p>
        </div>
      )}

    </div>
  );
}

export default ImageUpload;