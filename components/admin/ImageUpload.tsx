'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { storageService } from '@/services/storage.service';
import { toast } from 'sonner';

interface ImageUploadProps {
  value: string; // Current image URL
  onChange: (url: string) => void;
  onDelete?: () => void;
  label?: string;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onDelete,
  label = 'Image',
  bucket = 'products',
  folder,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      toast.info('Compressing and uploading image...');
      
      const result = await storageService.uploadImage(file, bucket, folder);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      onChange(result.url);
      
      // Show compression stats
      if (result.originalSize && result.compressedSize) {
        const savedPercentage = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(0);
        toast.success(`Image uploaded! Saved ${savedPercentage}% file size with high quality.`);
      } else {
        toast.success('Image uploaded successfully');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
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
    onChange(urlInput.trim());
    setUrlInput('');
    setShowUrlInput(false);
    toast.success('Image URL added');
  }

  function handleDelete() {
    if (onDelete) {
      onDelete();
    } else {
      onChange('');
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        {label}
      </label>

      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt={label}
            className="w-full h-48 object-cover rounded-lg border border-stone-300"
          />
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* File Upload Button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-colors"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                <p className="text-sm text-stone-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-stone-400" />
                <p className="text-sm text-stone-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-stone-500">Auto-compressed to WebP for fast loading</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
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
    </div>
  );
}
