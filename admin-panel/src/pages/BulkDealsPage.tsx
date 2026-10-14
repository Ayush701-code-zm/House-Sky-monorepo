import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Flame,
  Plus,
  Search,
  Building2,
  Home,
  Tag,
  Percent,
  CheckCircle2,
  Trash2,
  Edit3,
  Upload,
  X,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Check,
  AlertCircle
} from 'lucide-react';

interface ProjectOption {
  _id: string;
  name: string;
  code: string;
  city: string;
  location: string;
  bannerImage?: string;
  priceRange?: string;
}

interface PropertyOption {
  _id: string;
  title: string;
  city: string;
  location: string;
  heroImage?: string;
  price?: number;
}

interface BulkDealItem {
  _id: string;
  title: string;
  slug: string;
  dealType: 'PROJECT' | 'PROPERTY' | 'PACKAGE';
  projectId?: any;
  propertyId?: any;
  location: string;
  city: string;
  state: string;
  surveyNumber?: string;
  finalPlotNo?: string;
  areaSize?: string;
  roadWidth?: string;
  tpSectorVillage?: string;
  landPlotType?: string;
  isCorner?: string;
  unitType?: string;
  zone?: string;
  naStatus?: string;
  conditionTime?: string;
  ratePerUnit?: string;
  originalPriceDisplay: string;
  bulkPriceDisplay: string;
  discountPercentage: number;
  minQuantity: string;
  totalPackageUnits: string;
  perks: string[];
  bannerImage: string;
  bannerImageS3Key?: string;
  description: string;
  isAvailable: boolean;
  isFeatured: boolean;
  validTill?: string;
  order: number;
  createdAt: string;
}

const DEFAULT_PERKS = [
  '0% Brokerage',
  'Instant Registry & Demarcation',
  'NA Approved & Title Clear',
  'Free Site Visit Cab / Flight',
  'Flexible 12-Month EMI Option',
  'Corner Plot Preference Option'
];

export const BulkDealsPage: React.FC = () => {
  const { token } = useAuth();
  const toast = useToast();

  const [deals, setDeals] = useState<BulkDealItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<BulkDealItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    dealType: 'PROJECT' as 'PROJECT' | 'PROPERTY' | 'PACKAGE',
    projectId: '',
    propertyId: '',
    location: '',
    city: '',
    state: '',
    surveyNumber: '427',
    finalPlotNo: '521/1/1',
    areaSize: '6100 SQYD',
    roadWidth: '70 MTR',
    tpSectorVillage: '3C / Sector-12 / Rampura',
    landPlotType: 'Land',
    isCorner: 'Corner',
    unitType: 'SQYD',
    zone: 'HAC',
    naStatus: 'READY',
    conditionTime: '3 MONTHS',
    ratePerUnit: '18000',
    originalPriceDisplay: '',
    bulkPriceDisplay: '',
    discountPercentage: 20,
    minQuantity: '5 Plots / 1500 SQYD',
    totalPackageUnits: '8 Packages Available',
    perks: ['0% Brokerage', 'Instant Registry & Demarcation', 'NA Approved & Title Clear'],
    bannerImage: '',
    bannerImageS3Key: '',
    description: '',
    isAvailable: true,
    isFeatured: false,
    validTill: ''
  });


  const [customPerkInput, setCustomPerkInput] = useState('');

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/bulk-deals');
      setDeals(Array.isArray(res.data) ? res.data : []);
    } catch (error: any) {
      console.error('Error fetching bulk deals:', error);
      toast.error('Failed to load bulk deals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [projRes, propRes] = await Promise.all([
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/properties').catch(() => ({ data: [] }))
      ]);
      const projData = Array.isArray(projRes.data)
        ? projRes.data
        : (Array.isArray(projRes.data?.data) ? projRes.data.data : []);
      const propData = Array.isArray(propRes.data)
        ? propRes.data
        : (Array.isArray(propRes.data?.data) ? propRes.data.data : []);

      setProjects(projData);
      setProperties(propData);
    } catch (error) {
      console.error('Error fetching options:', error);
    }
  };

  useEffect(() => {
    fetchDeals();
    fetchOptions();
  }, [token]);

  const handleOpenModal = (deal?: BulkDealItem) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        title: deal.title || '',
        dealType: deal.dealType || 'PROJECT',
        projectId: deal.projectId?._id || deal.projectId || '',
        propertyId: deal.propertyId?._id || deal.propertyId || '',
        location: deal.location || '',
        city: deal.city || '',
        state: deal.state || '',
        surveyNumber: deal.surveyNumber || '',
        finalPlotNo: deal.finalPlotNo || '',
        areaSize: deal.areaSize || '',
        roadWidth: deal.roadWidth || '',
        tpSectorVillage: deal.tpSectorVillage || '',
        landPlotType: deal.landPlotType || 'Land',
        isCorner: deal.isCorner || 'Corner',
        unitType: deal.unitType || 'SQYD',
        zone: deal.zone || 'HAC',
        naStatus: deal.naStatus || 'READY',
        conditionTime: deal.conditionTime || '3 MONTHS',
        ratePerUnit: deal.ratePerUnit || '',
        originalPriceDisplay: deal.originalPriceDisplay || '',
        bulkPriceDisplay: deal.bulkPriceDisplay || '',
        discountPercentage: deal.discountPercentage || 0,
        minQuantity: deal.minQuantity || '',
        totalPackageUnits: deal.totalPackageUnits || '',
        perks: deal.perks && deal.perks.length > 0 ? deal.perks : ['0% Brokerage'],
        bannerImage: deal.bannerImage || '',
        bannerImageS3Key: (deal as any).bannerImageS3Key || '',
        description: deal.description || '',
        isAvailable: deal.isAvailable !== false,
        isFeatured: Boolean(deal.isFeatured),
        validTill: deal.validTill ? new Date(deal.validTill).toISOString().split('T')[0] : ''
      });
    } else {
      setEditingDeal(null);
      setFormData({
        title: '',
        dealType: 'PROJECT',
        projectId: '',
        propertyId: '',
        location: '',
        city: '',
        state: 'Gujarat',
        surveyNumber: '',
        finalPlotNo: '',
        areaSize: '',
        roadWidth: '',
        tpSectorVillage: '',
        landPlotType: 'Land',
        isCorner: 'Corner',
        unitType: 'SQYD',
        zone: 'HAC',
        naStatus: 'READY',
        conditionTime: '3 MONTHS',
        ratePerUnit: '',
        originalPriceDisplay: '',
        bulkPriceDisplay: '',
        discountPercentage: 20,
        minQuantity: '',
        totalPackageUnits: '',
        perks: ['0% Brokerage', 'Instant Registry & Demarcation', 'NA Approved & Title Clear'],
        bannerImage: '',
        bannerImageS3Key: '',
        description: '',
        isAvailable: true,
        isFeatured: false,
        validTill: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSelectProject = (projId: string) => {
    const p = projects.find((x) => x._id === projId);
    setFormData((prev) => ({
      ...prev,
      projectId: projId,
      title: p && (!editingDeal || !prev.title) ? `${p.name} - Bulk Investor Package` : prev.title,
      location: p && (!editingDeal || !prev.location) ? (p.location || prev.location) : prev.location,
      city: p && (!editingDeal || !prev.city) ? (p.city || prev.city) : prev.city,
      state: p && (!editingDeal || !prev.state) ? ((p as any).state || prev.state || 'Gujarat') : prev.state,
      bannerImage: p && (!editingDeal || !prev.bannerImage) ? (p.bannerImage || prev.bannerImage) : prev.bannerImage,
      bannerImageS3Key: p && p.bannerImage && (!editingDeal || !prev.bannerImage) ? ((p as any).bannerImageS3Key || '') : prev.bannerImageS3Key,
      originalPriceDisplay: p && (!editingDeal || !prev.originalPriceDisplay) ? (p.priceRange ? p.priceRange.split('-')[0].trim() : prev.originalPriceDisplay) : prev.originalPriceDisplay
    }));
  };

  const handleSelectProperty = (propId: string) => {
    const pr = properties.find((x) => x._id === propId);
    setFormData((prev) => ({
      ...prev,
      propertyId: propId,
      title: pr && (!editingDeal || !prev.title) ? `${pr.title} (Bulk Deal)` : prev.title,
      city: pr && (!editingDeal || !prev.city) ? (pr.city || prev.city) : prev.city,
      state: pr && (!editingDeal || !prev.state) ? ((pr as any).state || prev.state || 'Gujarat') : prev.state,
      bannerImage: pr && (!editingDeal || !prev.bannerImage) ? (pr.heroImage || prev.bannerImage) : prev.bannerImage,
      bannerImageS3Key: pr && pr.heroImage && (!editingDeal || !prev.bannerImage) ? '' : prev.bannerImageS3Key,
      originalPriceDisplay: pr && (!editingDeal || !prev.originalPriceDisplay) ? (pr.price ? `₹${pr.price.toLocaleString('en-IN')}` : prev.originalPriceDisplay) : prev.originalPriceDisplay
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'bulk_deals');

      const res = await api.post('/upload', uploadFormData);

      if (res.data?.url) {
        // Keep the S3 key so the backend can re-sign the (expiring) pre-signed URL on read
        setFormData((prev) => ({ ...prev, bannerImage: res.data.url, bannerImageS3Key: res.data.s3Key || '' }));
        toast.success('Banner image uploaded successfully');
      } else {
        toast.error('Image upload failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Image upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePerk = (perk: string) => {
    setFormData((prev) => {
      const exists = prev.perks.includes(perk);
      return {
        ...prev,
        perks: exists ? prev.perks.filter((p) => p !== perk) : [...prev.perks, perk]
      };
    });
  };

  const handleAddCustomPerk = () => {
    if (!customPerkInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      perks: Array.from(new Set([...prev.perks, customPerkInput.trim()]))
    }));
    setCustomPerkInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      toast.error('Please enter a title for the bulk deal');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        title: formData.title.trim(),
        projectId: formData.dealType === 'PROJECT' ? (formData.projectId || null) : null,
        propertyId: formData.dealType === 'PROPERTY' ? (formData.propertyId || null) : null
      };

      if (editingDeal) {
        await api.put(`/admin/bulk-deals/${editingDeal._id}`, payload);
        toast.success('Bulk deal updated successfully');
      } else {
        await api.post('/admin/bulk-deals', payload);
        toast.success('Bulk deal created successfully');
      }
      setIsModalOpen(false);
      fetchDeals();
    } catch (error: any) {
      console.error('Error saving bulk deal:', error);
      const msg = error.response?.data?.message || 'Server error while saving deal';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailable = async (deal: BulkDealItem) => {
    try {
      await api.put(`/admin/bulk-deals/${deal._id}`, { isAvailable: !deal.isAvailable });
      toast.success(`Deal availability status updated`);
      setDeals((prev) =>
        prev.map((d) => (d._id === deal._id ? { ...d, isAvailable: !d.isAvailable } : d))
      );
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bulk deal?')) return;
    try {
      await api.delete(`/admin/bulk-deals/${id}`);
      toast.success('Bulk deal deleted successfully');
      setDeals((prev) => prev.filter((d) => d._id !== id));
    } catch (error) {
      toast.error('Server error during deletion');
    }
  };


  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || deal.dealType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#061913] via-[#0A2E23] to-[#0B4F3C] rounded-3xl p-6 text-white shadow-xl border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Investor Deals Manager
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            Wholesale Bulk Deals & Syndicates
          </h1>
          <p className="text-white/70 text-xs md:text-sm mt-1 max-w-2xl">
            Create, publish, and control exclusive bulk land/project packages displayed directly on the landing page for high-ticket buyers and investor groups.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Bulk Deal
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals by title, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PROJECT', 'PROPERTY', 'PACKAGE'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                filterType === type
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Bulk Deals */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-4 h-72 animate-pulse" />
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Flame className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Bulk Deals Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm
              ? 'No bulk deals match your search criteria.'
              : 'You have not created any bulk deal packages yet. Click "Create Bulk Deal" above to publish your first investor package.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => (
            <div
              key={deal._id}
              className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${
                deal.isAvailable ? 'border-slate-200' : 'border-slate-200 opacity-60'
              }`}
            >
              <div>
                <div className="relative h-44 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 overflow-hidden">
                  <img
                    src={deal.bannerImage || deal.projectId?.bannerImage || deal.propertyId?.heroImage || ''}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-lg uppercase tracking-wider shadow-md flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-slate-950" /> {deal.discountPercentage}% OFF
                    </span>
                    <div className="flex items-center gap-1.5">
                      {deal.isFeatured && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-extrabold rounded uppercase">
                          FEATURED
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold rounded uppercase">
                        {deal.dealType}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Image Title */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="flex items-center gap-1 text-[11px] text-amber-300 font-semibold mb-0.5">
                      <MapPin className="w-3 h-3" /> {deal.city}, {deal.state || 'Gujarat'}
                    </div>
                    <h3 className="text-sm font-bold truncate leading-snug">{deal.title}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Pricing Comparison */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Original Rate</span>
                      <span className="text-xs text-slate-400 line-through font-bold">
                        {deal.originalPriceDisplay || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">Bulk Deal Rate</span>
                      <span className="text-sm text-emerald-700 font-extrabold">
                        {deal.bulkPriceDisplay || 'Special Quote'}
                      </span>
                    </div>
                  </div>

                  {/* Min Quantity & Package count */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9.5px] text-slate-500 font-semibold uppercase block">Min Quantity</span>
                      <span className="font-bold text-slate-800">{deal.minQuantity}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[9.5px] text-slate-500 font-semibold uppercase block">Package Size</span>
                      <span className="font-bold text-slate-800">{deal.totalPackageUnits}</span>
                    </div>
                  </div>

                  {/* Perks list */}
                  {deal.perks && deal.perks.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included Deal Perks</span>
                      <div className="flex flex-wrap gap-1">
                        {deal.perks.slice(0, 3).map((perk, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-md border border-emerald-200/60 flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> {perk}
                          </span>
                        ))}
                        {deal.perks.length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                            +{deal.perks.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAvailable(deal)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                    deal.isAvailable
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${deal.isAvailable ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                  {deal.isAvailable ? 'Active Live' : 'Hidden'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(deal)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Edit Deal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(deal._id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Deal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col my-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDeal ? 'Edit Bulk Deal Package' : 'Create New Wholesale Bulk Deal'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set discount rates, minimum order quantity, and investor perks for landing page.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Deal Type & Auto-Fill Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Deal Scope / Type
                  </label>
                  <select
                    value={formData.dealType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dealType: e.target.value as 'PROJECT' | 'PROPERTY' | 'PACKAGE'
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold bg-slate-50"
                  >
                    <option value="PROJECT">Project Wholesale Bundle</option>
                    <option value="PROPERTY">Specific Property Bulk Deal</option>
                    <option value="PACKAGE">Custom Investor Syndicate Package</option>
                  </select>
                </div>

                {/* Option Pickers */}
                {formData.dealType === 'PROJECT' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Link Existing Real Estate Project
                    </label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => handleSelectProject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Select Project to Auto-fill --</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.code}) - {p.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.dealType === 'PROPERTY' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Link Specific Property Listing
                    </label>
                    <select
                      value={formData.propertyId}
                      onChange={(e) => handleSelectProperty(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Select Property --</option>
                      {properties.map((pr) => (
                        <option key={pr._id} value={pr._id}>
                          {pr.title} - {pr.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Title & Location / City / State */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Bulk Deal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dholera Smart City Phase 1 Investor Package"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TP 3C, Sector 12"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dholera"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gujarat"
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* TECHNICAL LAND & PLOT SPECIFICATIONS (Matching House & Sky Spec Sheet) */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4" /> Technical Land Spec Sheet Details
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    Official Card Fields
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Survey No</label>
                    <input
                      type="text"
                      placeholder="e.g. 427"
                      value={formData.surveyNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, surveyNumber: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Old FP No</label>
                    <input
                      type="text"
                      placeholder="e.g. 521/1/1"
                      value={formData.finalPlotNo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, finalPlotNo: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Total Area</label>
                    <input
                      type="text"
                      placeholder="e.g. 6100 SQYD"
                      value={formData.areaSize}
                      onChange={(e) => setFormData((prev) => ({ ...prev, areaSize: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Road Width</label>
                    <input
                      type="text"
                      placeholder="e.g. 70 MTR"
                      value={formData.roadWidth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, roadWidth: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">TP / Sector / Village</label>
                    <input
                      type="text"
                      placeholder="e.g. 3C / Sector-12 / Rampura"
                      value={formData.tpSectorVillage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tpSectorVillage: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Land / Plot</label>
                    <input
                      type="text"
                      placeholder="e.g. Land"
                      value={formData.landPlotType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, landPlotType: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Corner Status</label>
                    <select
                      value={formData.isCorner}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isCorner: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    >
                      <option value="Corner">Corner</option>
                      <option value="Normal">Normal</option>
                      <option value="2-Side Open">2-Side Open</option>
                      <option value="3-Side Open">3-Side Open</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Unit Type</label>
                    <select
                      value={formData.unitType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, unitType: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    >
                      <option value="SQYD">SQYD</option>
                      <option value="SQMT">SQMT</option>
                      <option value="SQFT">SQFT</option>
                      <option value="ACRE">ACRE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Zone</label>
                    <input
                      type="text"
                      placeholder="e.g. HAC / Residential"
                      value={formData.zone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, zone: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">NA Status</label>
                    <select
                      value={formData.naStatus}
                      onChange={(e) => setFormData((prev) => ({ ...prev, naStatus: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    >
                      <option value="READY">READY</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="IN_PROCESS">IN_PROCESS</option>
                      <option value="AGRICULTURAL">AGRICULTURAL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Possession Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. 3 MONTHS / IMMEDIATE"
                      value={formData.conditionTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, conditionTime: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">Rate per Unit (₹)</label>
                    <input
                      type="text"
                      placeholder="e.g. 18000"
                      value={formData.ratePerUnit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ratePerUnit: e.target.value }))}
                      className="w-full px-3 py-1.5 bg-neutral-950 border border-amber-400/50 rounded-lg text-amber-300 font-bold focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Spec Sheet Table Live Card Preview */}
                <div className="mt-3 bg-gradient-to-b from-[#0A2E23] to-[#04140F] border border-amber-500/40 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-amber-400/30 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs font-serif font-bold">H&S</div>
                      <span className="font-serif font-bold text-sm text-white">House & Sky - Spec Sheet Preview</span>
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest">LIVE CARD PREVIEW</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {[
                      { label: 'Survey No', value: formData.surveyNumber || '427' },
                      { label: 'Old FP No', value: formData.finalPlotNo || '521/1/1' },
                      { label: 'Area', value: formData.areaSize || '6100 SQYD' },
                      { label: 'Road', value: formData.roadWidth || '70 MTR' },
                      { label: 'TP / Sector / Village', value: formData.tpSectorVillage || '3C / Sector-12 / Rampura' },
                      { label: 'City / State', value: `${formData.city || 'Dholera City'}, ${formData.state || 'Gujarat'}` },
                      { label: 'Land / Plot', value: formData.landPlotType || 'Land' },
                      { label: 'Corner Status', value: formData.isCorner || 'Corner' },
                      { label: 'Zone', value: formData.zone || 'HAC' },
                      { label: 'NA Status', value: formData.naStatus || 'READY' },
                      { label: 'Condition', value: formData.conditionTime || '3 MONTHS' },
                      { label: 'Rate', value: formData.ratePerUnit ? `₹${Number(formData.ratePerUnit).toLocaleString('en-IN')}` : '₹18,000' }
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="text-neutral-400 font-medium text-[11px]">{row.label}</span>
                        <span className="font-bold text-white text-[11px]">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Highlight Banner */}
                  <div className="mt-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-3 text-slate-950 flex items-center justify-between font-extrabold shadow-md">
                    <div className="text-lg">
                      {formData.areaSize || '6100 SQYD'}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase block tracking-wider opacity-80">Bulk Rate</span>
                      <span className="text-base">
                        ₹{Number(formData.ratePerUnit || 18000).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* Pricing & Discount */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Original Price Display
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹22,000 / SQYD"
                    value={formData.originalPriceDisplay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, originalPriceDisplay: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    🔥 Bulk Deal Special Price
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₹16,500 / SQYD"
                    value={formData.bulkPriceDisplay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bulkPriceDisplay: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 font-bold bg-white text-emerald-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Discount Percentage (% OFF)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discountPercentage: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold bg-white"
                  />
                </div>
              </div>

              {/* Min Quantity & Total Units */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Minimum Order Quantity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Min 5 Plots / 2,000 SQYD"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minQuantity: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Total Packages Available
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Only 10 Packages Available"
                    value={formData.totalPackageUnits}
                    onChange={(e) => setFormData((prev) => ({ ...prev, totalPackageUnits: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Included Perks Manager */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Select Investor Perks & Benefits
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DEFAULT_PERKS.map((perk) => {
                    const isSelected = formData.perks.includes(perk);
                    return (
                      <button
                        key={perk}
                        type="button"
                        onClick={() => handleTogglePerk(perk)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {perk}
                      </button>
                    );
                  })}
                </div>

                {/* Custom perk input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom perk (e.g. Free Club Membership)"
                    value={customPerkInput}
                    onChange={(e) => setCustomPerkInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPerk}
                    className="px-3.5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shrink-0"
                  >
                    Add Perk
                  </button>
                </div>
              </div>

              {/* Banner Image Uploader */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Banner Showcase Image
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="https://... or upload image"
                    value={formData.bannerImage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bannerImage: e.target.value, bannerImageS3Key: '' }))}
                    className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Uploading...' : 'Upload S3'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {formData.bannerImage && (
                  <div className="mt-2 relative aspect-video max-h-36 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={formData.bannerImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Deal Description & Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide key deal information, location connectivity, NA clear status..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isAvailable: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Publish & Show on Website</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-amber-700">Highlight as Featured Deal</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isSaving ? 'Saving Deal...' : editingDeal ? 'Save Changes' : 'Publish Bulk Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDealsPage;
