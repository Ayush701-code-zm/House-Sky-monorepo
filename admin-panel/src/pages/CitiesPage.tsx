import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2, Edit, Eye, EyeOff, MapPin, Upload, X, Check, Loader2, Navigation, Search } from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../context/ToastContext';

export interface CityAdminItem {
  _id: string;
  name: string;
  state?: string;
  imageUrl?: string;
  imageS3Key?: string;
  latitude?: number | null;
  longitude?: number | null;
  order: number;
  isActive: boolean;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const inputClass = 'w-full border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C]';

interface CityModalProps {
  city: CityAdminItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AddEditCityModal({ city, onClose, onSuccess }: CityModalProps) {
  const toast = useToast();
  const [name, setName] = useState(city?.name || '');
  const [state, setState] = useState(city?.state || '');
  const [imageUrl, setImageUrl] = useState(city?.imageUrl || '');
  const [imageS3Key, setImageS3Key] = useState(city?.imageS3Key || '');
  const [latitude, setLatitude] = useState(city?.latitude != null ? String(city.latitude) : '');
  const [longitude, setLongitude] = useState(city?.longitude != null ? String(city.longitude) : '');
  const [order, setOrder] = useState<number>(city?.order || 0);
  const [isActive, setIsActive] = useState<boolean>(city ? city.isActive : true);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose an image file');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError('Image size exceeds 10MB limit');
      return;
    }
    setUploadError('');
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'city_images');
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
    if (!name.trim()) {
      toast.error('City name is required');
      return;
    }
    // Both or neither: a lone latitude/longitude can't be used for nearby search.
    if (Boolean(latitude.trim()) !== Boolean(longitude.trim())) {
      toast.error('Enter both latitude and longitude, or leave both empty to auto-detect');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        state: state.trim(),
        imageUrl,
        imageS3Key,
        latitude: latitude.trim() === '' ? null : Number(latitude),
        longitude: longitude.trim() === '' ? null : Number(longitude),
        order: Number(order) || 0,
        isActive
      };
      const res = city
        ? await api.put(`/admin/cities/${city._id}`, payload)
        : await api.post('/admin/cities', payload);
      const saved: CityAdminItem = res.data;
      const located = saved?.latitude != null && saved?.longitude != null;
      toast.success(
        `${saved?.name || payload.name} ${city ? 'updated' : 'added'}` +
        (located ? '' : ' — location not found, nearby search will skip this city until coordinates are added')
      );
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save city');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#0B4F3C]/20 w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0EC] flex items-center justify-center text-[#0B4F3C]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#171A18]">{city ? `Edit ${city.name}` : 'Add City'}</h3>
              <p className="text-xs text-[#171A18]/60">Shown in the website's city dropdown, search & city cards</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#171A18]/40 hover:text-[#171A18] rounded-xl hover:bg-[#E8F0EC] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-bold text-[#171A18]/80 block">Background Image</label>
            {imageUrl ? (
              <div className="relative aspect-[16/7] rounded-2xl overflow-hidden border border-[#0B4F3C]/20 bg-slate-900">
                <img src={imageUrl} alt="City background preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-3 left-4 font-serif text-lg font-bold text-white">{name || 'City name'}</span>
                <button
                  type="button"
                  onClick={() => { setImageUrl(''); setImageS3Key(''); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#0B4F3C]/25 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer bg-[#FDFCF0] hover:bg-[#E8F0EC]/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-[#0B4F3C]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-bold">Uploading…</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#0B4F3C]/60 mx-auto" />
                    <p className="font-bold text-[#171A18]">Click to upload a city photo</p>
                    <p className="text-[10px] text-[#171A18]/50">Landscape JPG, PNG, WEBP up to 10MB (optional)</p>
                  </>
                )}
              </label>
            )}
            {uploadError && <p className="text-[11px] font-semibold text-red-600">{uploadError}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-[#171A18]/80 block">City Name <span className="text-red-500">*</span></label>
              <input type="text" maxLength={60} className={inputClass} placeholder="e.g. Dholera" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="font-bold text-[#171A18]/80 block">State</label>
              <input type="text" maxLength={60} className={inputClass} placeholder="e.g. Gujarat" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#171A18]/80 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#0B4F3C]" /> Location for “Nearby” search
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" step="any" className={inputClass} placeholder="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
              <input type="number" step="any" className={inputClass} placeholder="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
            <p className="text-[10px] text-[#171A18]/50">Leave empty — it's detected automatically from the city & state name.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="font-bold text-[#171A18]/80 block">Display Order</label>
              <input type="number" className={inputClass} value={order} onChange={(e) => setOrder(Number(e.target.value))} />
            </div>
            <label className="pt-5 inline-flex items-center gap-2 cursor-pointer font-bold text-[#171A18]">
              <input type="checkbox" className="w-4 h-4 rounded accent-[#0B4F3C] cursor-pointer" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Show on website
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#0B4F3C]/15">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#0B4F3C]/20 text-xs font-bold text-[#171A18] hover:bg-[#E8F0EC] cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold hover:bg-[#073629] transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Check className="w-4 h-4" /> Save City</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const CitiesPage: React.FC = () => {
  const toast = useToast();
  const [cities, setCities] = useState<CityAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityAdminItem | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/cities');
      setCities(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load cities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleActive = async (city: CityAdminItem) => {
    try {
      await api.put(`/admin/cities/${city._id}`, { isActive: !city.isActive });
      toast.success(`${city.name} ${city.isActive ? 'hidden from' : 'shown on'} the website`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update city');
    }
  };

  const handleDelete = async (city: CityAdminItem) => {
    if (!window.confirm(`Remove ${city.name} from the website city list?`)) return;
    try {
      await api.delete(`/admin/cities/${city._id}`);
      toast.success(`${city.name} removed`);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to delete city');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q) || (c.state || '').toLowerCase().includes(q));
  }, [cities, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Cities & Locations</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">
            Cities added here appear in the website's city dropdown, location search and city cards.
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
            onClick={() => { setEditingCity(null); setIsModalOpen(true); }}
            className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md hover:bg-[#073629] transition-all"
          >
            <Plus className="w-4 h-4" /> Add City
          </button>
        </div>
      </div>

      {cities.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#171A18]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities…"
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#0B4F3C]/20 rounded-xl text-xs focus:outline-none focus:border-[#0B4F3C]"
          />
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && !isLoading && filtered.length === 0 && (
        <EmptyState
          icon={MapPin}
          title={cities.length === 0 ? 'No Cities Yet' : 'No Matching Cities'}
          description={cities.length === 0
            ? 'Add your first city. Until then the website shows its built-in default city list.'
            : 'Try a different search.'}
        />
      )}

      {!error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((city) => (
            <div key={city._id} className="bg-white border border-[#0B4F3C]/15 rounded-3xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="relative aspect-[16/9] bg-gradient-to-br from-[#061913] via-[#0A2E23] to-[#0B4F3C] overflow-hidden">
                {city.imageUrl && <img src={city.imageUrl} alt={city.name} className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h4 className="font-serif text-lg font-bold text-white leading-tight">{city.name}</h4>
                  {city.state && <p className="text-[11px] text-white/75">{city.state}</p>}
                </div>
                <button
                  onClick={() => handleToggleActive(city)}
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-extrabold shadow-sm flex items-center gap-1 cursor-pointer transition-colors ${
                    city.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-800/80 text-white/80'
                  }`}
                  title={city.isActive ? 'Hide from website' : 'Show on website'}
                >
                  {city.isActive ? <><Eye className="w-3 h-3" /> Live</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
                </button>
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className={`inline-flex items-center gap-1 font-semibold ${city.latitude != null ? 'text-[#0B4F3C]' : 'text-amber-700'}`}>
                    <Navigation className="w-3 h-3" />
                    {city.latitude != null && city.longitude != null
                      ? `${city.latitude.toFixed(3)}, ${city.longitude.toFixed(3)}`
                      : 'No location — nearby off'}
                  </span>
                  <span className="text-[#171A18]/50 font-semibold">Order {city.order}</span>
                </div>
                <div className="flex items-center pt-3 border-t border-[#0B4F3C]/10">
                  <button
                    onClick={() => { setEditingCity(city); setIsModalOpen(true); }}
                    className="flex-1 py-1.5 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] font-bold flex items-center justify-center gap-1 hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(city)}
                    className="ml-2 p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete city"
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
        <AddEditCityModal
          city={editingCity}
          onClose={() => { setIsModalOpen(false); setEditingCity(null); }}
          onSuccess={load}
        />
      )}
    </div>
  );
};
