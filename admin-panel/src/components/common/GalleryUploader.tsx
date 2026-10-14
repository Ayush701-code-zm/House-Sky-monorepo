import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import api from '../../services/api';
import { GalleryImage } from '../../types';
import { useToast } from '../../context/ToastContext';

interface GalleryUploaderProps {
  items: GalleryImage[];
  onChange: (items: GalleryImage[]) => void;
  folder: string;
  maxItems?: number;
  label?: string;
}

const DEFAULT_MAX_ITEMS = 12;

export const GalleryUploader: React.FC<GalleryUploaderProps> = ({
  items,
  onChange,
  folder,
  maxItems = DEFAULT_MAX_ITEMS,
  label = 'Photo Gallery'
}) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxItems - items.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxItems} images allowed`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setIsUploading(true);

    const uploaded: GalleryImage[] = [];
    for (const file of selected) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        const response = await api.post('/upload', formData);
        if (response.data?.url) {
          uploaded.push({
            url: response.data.url,
            s3Key: response.data.s3Key || '',
            caption: file.name
          });
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...items, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-[#171A18]/70 font-semibold block text-xs">{label}</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {items.map((item, index) => (
          <div key={`${item.url}-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-[#0B4F3C]/15 bg-[#FDFCF0] group">
            <img src={item.url} alt={item.caption || `Gallery ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Remove image"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {items.length < maxItems && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[#0B4F3C]/25 bg-[#E8F0EC] text-[#0B4F3C] flex flex-col items-center justify-center gap-1 hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            {isUploading ? <UploadCloud className="w-5 h-5 animate-pulse" /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-[10px] font-bold">{isUploading ? 'Uploading…' : 'Add photos'}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-[10px] text-[#171A18]/50">{items.length}/{maxItems} images · stored on S3</p>
    </div>
  );
};
