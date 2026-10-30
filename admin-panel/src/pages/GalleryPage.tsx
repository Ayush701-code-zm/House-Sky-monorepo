import React, { useEffect, useState, useMemo } from 'react';
import { Plus, RefreshCw, Trash2, Edit, Eye, EyeOff, Image as ImageIcon, Upload, X, Check, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../context/ToastContext';
import { DraftNotice } from '../components/common/DraftNotice';
import { mergeDraft, usePersistDraft } from '../utils/useFormDraft';

export interface GalleryAdminItem {
  _id: string;
  title: string;
  category: string;
  imageUrl: string;
  imageS3Key?: string;
  caption?: string;
  order: number;
  isPublished: boolean;
  createdAt?: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'PROJECT_SHOWCASE', label: 'Project Showcase' },
  { id: 'SITE_VISITS', label: 'Site Visits' },
  { id: 'EVENTS_CONFERENCES', label: 'Events & Conferences' },
  { id: 'MODEL_TOWNSHIPS', label: 'Model Townships' },
  { id: 'CUSTOMER_DELIVERIES', label: 'Customer Deliveries' },
  { id: 'GENERAL', label: 'General' },
];

const CATEGORY_LABEL: Record<string, string> = {
  PROJECT_SHOWCASE: 'Project Showcase',
  SITE_VISITS: 'Site Visits',
  EVENTS_CONFERENCES: 'Events & Conferences',
  MODEL_TOWNSHIPS: 'Model Townships',
  CUSTOMER_DELIVERIES: 'Customer Deliveries',
  GENERAL: 'General',
};

interface AddEditModalProps {
  item?: GalleryAdminItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function galleryBaseline(item?: GalleryAdminItem | null) {
  return {
    title: item?.title || '',
    category: item?.category || 'PROJECT_SHOWCASE',
    imageUrl: item?.imageUrl || '',
    imageS3Key: item?.imageS3Key || '',
    caption: item?.caption || '',
    order: item?.order || 0,
    isPublished: item?.isPublished !== undefined ? item.isPublished : true,
  };
}

function AddEditGalleryModal({ item, onClose, onSuccess }: AddEditModalProps) {
  const toast = useToast();
  const draftKey = `hs-admin-gallery-${item?._id || 'new'}`;
  const baseline = galleryBaseline(item);
  const [boot] = useState(() => mergeDraft(draftKey, baseline));
  const initial = boot.value;
  const [draftRestored, setDraftRestored] = useState(boot.restored);
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [imageS3Key, setImageS3Key] = useState(initial.imageS3Key);
  const [caption, setCaption] = useState(initial.caption);
  const [order, setOrder] = useState<number>(initial.order);
  const [isPublished, setIsPublished] = useState<boolean>(initial.isPublished);
  const clearGalleryDraft = usePersistDraft(draftKey, {
    title, category, imageUrl, imageS3Key, caption, order, isPublished,
  }, baseline);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit');
      return;
    }
    setUploadError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'admin_gallery');

      const res = await api.post('/upload', formData);

      if (res.data?.url) {
        setImageUrl(res.data.url);
        setImageS3Key(res.data.s3Key || '');
      } else {
        setUploadError('Failed to upload image');
      }
    } catch (e: any) {
      setUploadError(e.response?.data?.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Title and image upload are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        imageUrl: imageUrl.trim(),
        imageS3Key,
        caption: caption.trim(),
        order: Number(order) || 0,
        isPublished
      };

      if (item) {
        await api.put(`/admin/gallery/${item._id}`, payload);
        toast.success('Gallery item updated');
      } else {
        await api.post('/admin/gallery', payload);
        toast.success('New image added to Gallery');
      }
      clearGalleryDraft();
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save gallery item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#0B4F3C]/20 w-full max-w-lg p-6 space-y-5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0EC] flex items-center justify-center text-[#0B4F3C]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#171A18]">
                {item ? 'Edit Gallery Photo' : 'Upload To Showcase Gallery'}
              </h3>
              <p className="text-xs text-[#171A18]/60">Shown exclusively on the public website Gallery page</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#171A18]/40 hover:text-[#171A18] rounded-xl hover:bg-[#E8F0EC]">
            <X className="w-5 h-5" />
          </button>
        </div>
        {draftRestored && (
          <DraftNotice onDiscard={() => {
            clearGalleryDraft();
            setTitle(baseline.title);
            setCategory(baseline.category);
            setImageUrl(baseline.imageUrl);
            setImageS3Key(baseline.imageS3Key);
            setCaption(baseline.caption);
            setOrder(baseline.order);
            setIsPublished(baseline.isPublished);
            setDraftRestored(false);
          }} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Image Upload Area */}
          <div className="space-y-2">
            <label className="font-bold text-[#171A18]/80 block">
              Gallery Photo <span className="text-red-500">*</span>
            </label>
            {imageUrl ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#0B4F3C]/20 group bg-slate-900">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageUrl(''); setImageS3Key(''); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#0B4F3C]/25 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer bg-[#FDFCF0] hover:bg-[#E8F0EC]/50 transition-colors block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-[#0B4F3C]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-bold">Uploading to S3…</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#0B4F3C]/60 mx-auto" />
                    <div>
                      <p className="font-bold text-[#171A18]">Click to select gallery photo</p>
                      <p className="text-[10px] text-[#171A18]/50">JPG, PNG, WEBP up to 10MB</p>
                    </div>
                  </>
                )}
              </label>
            )}
            {uploadError && <p className="text-[11px] font-semibold text-red-600">{uploadError}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-[#171A18]/80 block">
                Photo Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C]"
                placeholder="e.g. Royal Greens Township Entry Gate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-[#171A18]/80 block">Category</label>
              <select
                className="w-full border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C] bg-white cursor-pointer font-semibold"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.filter((c) => c.id !== 'ALL').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#171A18]/80 block">Caption / Subtitle (optional)</label>
            <input
              type="text"
              className="w-full border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C]"
              placeholder="e.g. On-site customer visit during Phase 1 handover"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center pt-1">
            <div className="space-y-1.5">
              <label className="font-bold text-[#171A18]/80 block">Display Order</label>
              <input
                type="number"
                className="w-full border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C]"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>

            <div className="pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-[#171A18]">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#0B4F3C] cursor-pointer"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                <span>Publish to Public Gallery</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0B4F3C]/15">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#0B4F3C]/20 text-xs font-bold text-[#171A18] hover:bg-[#E8F0EC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold hover:bg-[#073629] transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Check className="w-4 h-4" /> Save Photo</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const GalleryPage: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<GalleryAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryAdminItem | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/gallery');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load gallery items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTogglePublish = async (item: GalleryAdminItem) => {
    try {
      await api.put(`/admin/gallery/${item._id}`, { isPublished: !item.isPublished });
      toast.success(`Photo ${item.isPublished ? 'unpublished' : 'published to public gallery'}`);
      load();
    } catch (e: any) {
      toast.error('Failed to update publish status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this gallery photo?')) return;
    try {
      await api.delete(`/admin/gallery/${id}`);
      toast.success('Gallery photo deleted');
      load();
    } catch (e: any) {
      toast.error('Failed to delete gallery item');
    }
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === 'ALL') return items;
    return items.filter((item) => item.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-serif font-bold text-[#171A18]">Public Gallery Showcase</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0EC] text-[#0B4F3C] text-[10px] font-extrabold uppercase">
              Dedicated Admin Gallery
            </span>
          </div>
          <p className="text-xs text-[#171A18]/70 mt-1">
            Only photos uploaded here appear on the public website Gallery page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] cursor-pointer hover:bg-[#0B4F3C] hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md hover:bg-[#073629] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Gallery Photo
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 bg-[#E8F0EC]/60 rounded-xl p-1.5 overflow-x-auto border border-[#0B4F3C]/10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeCategory === cat.id
                ? 'bg-[#0B4F3C] text-white shadow-sm'
                : 'text-[#171A18]/70 hover:text-[#171A18] hover:bg-white/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && !isLoading && filteredItems.length === 0 && (
        <EmptyState
          icon={ImageIcon}
          title="No Gallery Photos"
          description="Upload showcase photos here to display on the public website Gallery page."
        />
      )}

      {/* Gallery Cards Grid */}
      {!error && !isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-[#0B4F3C]/15 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square bg-slate-900 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 text-[9px] font-extrabold text-[#0B4F3C] shadow-sm uppercase tracking-wider">
                  {CATEGORY_LABEL[item.category] || item.category}
                </span>
                <button
                  onClick={() => handleTogglePublish(item)}
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-extrabold shadow-sm flex items-center gap-1 cursor-pointer transition-colors ${
                    item.isPublished
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800/80 text-white/80'
                  }`}
                >
                  {item.isPublished ? <><Eye className="w-3 h-3" /> Live</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
                </button>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-[#171A18] text-sm leading-snug line-clamp-1">{item.title}</h4>
                  {item.caption && <p className="text-xs text-[#171A18]/60 mt-0.5 line-clamp-2">{item.caption}</p>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#0B4F3C]/10 text-xs">
                  <button
                    onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                    className="flex-1 py-1.5 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] font-bold flex items-center justify-center gap-1 hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="ml-2 p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <AddEditGalleryModal
          item={editingItem}
          onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
          onSuccess={load}
        />
      )}
    </div>
  );
};
