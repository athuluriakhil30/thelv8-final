'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Link as LinkIcon, Plus } from 'lucide-react';
import { storageService } from '@/services/storage.service';
import { toast } from 'sonner';

interface MultiImageUploadProps {
  values: string[]; // Array of image URLs
  onChange: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
  bucket?: string;
  folder?: string;
}

export function MultiImageUpload({
  values,
  onChange,
  maxImages = 10,
  label = 'Product Images',
  bucket = 'products',
  folder,
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (values.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      // Show compression message for user feedback
      toast.info(`Compressing and uploading ${files.length} image(s)...`);
      
      const results = await storageService.uploadMultipleImages(files, bucket, folder);
      
      const successfulUploads = results.filter((r) => !r.error);
      const failedUploads = results.filter((r) => r.error);

      if (successfulUploads.length > 0) {
        const newUrls = successfulUploads.map((r) => r.url);
        onChange([...values, ...newUrls]);
        
        // Show compression stats in success message
        const totalOriginal = successfulUploads.reduce((sum, r) => sum + (r.originalSize || 0), 0);
        const totalCompressed = successfulUploads.reduce((sum, r) => sum + (r.compressedSize || 0), 0);
        const savedPercentage = ((totalOriginal - totalCompressed) / totalOriginal * 100).toFixed(0);
        
        toast.success(
          `${successfulUploads.length} image(s) uploaded! Saved ${savedPercentage}% file size with high quality.`
        );
      }

      if (failedUploads.length > 0) {
        toast.error(`${failedUploads.length} image(s) failed to upload`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleUrlSubmit() {
    if (!urlInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (values.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    onChange([...values, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Image URL added');
  }

  function handleDelete(index: number) {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
    toast.success('Image removed');
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    const newValues = [...values];
    const [removed] = newValues.splice(fromIndex, 1);
    newValues.splice(toIndex, 0, removed);
    onChange(newValues);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-stone-700">
          {label}
        </label>
        <span className="text-xs text-stone-500">
          {values.length} / {maxImages} images
        </span>
      </div>

      {/* Image Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {values.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-stone-300"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Section */}
      {values.length < maxImages && (
        <div className="space-y-3">
          {/* File Upload Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                <p className="text-sm text-stone-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Plus className="w-6 h-6 text-stone-400" />
                <p className="text-sm text-stone-600">
                  Click to upload more images
                </p>
                <p className="text-xs text-stone-500">Auto-compressed to WebP for fast loading</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesSelect}
            className="hidden"
          />

          {/* URL Input Toggle */}
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Or enter image URL
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                }}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {values.length === 0 && (
        <p className="text-sm text-stone-500 text-center">
          First image will be used as the main product image
        </p>
      )}
    </div>
  );
}
