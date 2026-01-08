import { supabase } from '@/lib/supabase/client';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
}

export const storageService = {
  /**
   * Compress image before upload
   * @param file - Original image file
   * @param options - Compression options
   * @returns Compressed file
   */
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 0.85,
      convertToWebP = true,
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas for compression
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          const mimeType = convertToWebP ? 'image/webp' : 
                          file.type === 'image/png' ? 'image/png' : 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file from blob
              const extension = convertToWebP ? 'webp' : 
                               file.name.split('.').pop() || 'jpg';
              const fileName = file.name.replace(/\.[^/.]+$/, `.${extension}`);
              const compressedFile = new File([blob], fileName, {
                type: mimeType,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            mimeType,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Upload image to Supabase Storage
   * @param file - File object to upload
   * @param bucket - Storage bucket name (default: 'products')
   * @param folder - Optional folder path within bucket
   * @returns Public URL of uploaded image
   */
  async uploadImage(
    file: File,
    bucket: string = 'products',
    folder?: string
  ): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { url: '', path: '', error: 'File must be an image' };
      }

      const originalSize = file.size;

      // Compress image before upload
      const compressedFile = await this.compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        convertToWebP: true,
      });

      const compressedSize = compressedFile.size;

      // Validate file size after compression (max 5MB, but should be much smaller now)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (compressedSize > maxSize) {
        return { 
          url: '', 
          path: '', 
          error: 'Image is too large even after compression. Please use a smaller image.',
          originalSize,
          compressedSize,
        };
      }

      // Generate unique file name (always use webp extension after compression)
      const fileExt = 'webp';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload compressed file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          cacheControl: '31536000', // 1 year cache (images don't change)
          upsert: false,
          contentType: 'image/webp',
        });

      if (error) {
        console.error('Upload error:', error);
        return { 
          url: '', 
          path: '', 
          error: error.message,
          originalSize,
          compressedSize,
        };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Log compression stats
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      console.log(`Image compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`);

      return {
        url: publicUrl,
        path: filePath,
        originalSize,
        compressedSize,
      };
    } catch (error: any) {
      console.error('Upload exception:', error);
      return { url: '', path: '', error: error.message || 'Upload failed' };
    }
  },

  /**
   * Upload multiple images
   * @param files - Array of File objects
   * @param bucket - Storage bucket name
   * @param folder - Optional folder path
   * @returns Array of upload results
   */
  async uploadMultipleImages(
    files: File[],
    bucket: string = 'products',
    folder?: string
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file, bucket, folder)
    );
    return Promise.all(uploadPromises);
  },

  /**
   * Delete image from Supabase Storage
   * @param path - File path in storage
   * @param bucket - Storage bucket name
   */
  async deleteImage(path: string, bucket: string = 'products'): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete exception:', error);
      return false;
    }
  },

  /**
   * Extract storage path from public URL
   * @param url - Full public URL
   * @returns Storage path or null
   */
  extractPathFromUrl(url: string): string | null {
    try {
      // Example URL: https://[project].supabase.co/storage/v1/object/public/products/image.jpg
      const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  /**
   * Get public URL for a file path
   * @param path - File path in storage
   * @param bucket - Storage bucket name
   */
  getPublicUrl(path: string, bucket: string = 'products'): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};
