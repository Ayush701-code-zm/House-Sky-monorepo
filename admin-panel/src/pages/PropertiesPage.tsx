import React, { useEffect, useState, useMemo } from 'react';
import { Edit, Home, Plus, RefreshCw, Trash2, CheckCircle, XCircle, Clock, ExternalLink, ShieldCheck, X, FileText, UserCheck, Tag, ShoppingCart, ChevronDown } from 'lucide-react';
import { ListingProperty } from '../types';
import { deleteProperty, fetchProperties, approveProperty, rejectProperty, updatePropertyStatus } from '../services/propertiesService';
import { AddPropertyModal } from '../components/properties/AddPropertyModal';
import { EditPropertyModal } from '../components/properties/EditPropertyModal';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../context/ToastContext';

const TYPE_LABEL: Record<string, string> = {
  RESIDENTIAL_PLOT: 'Residential Plot',
  COMMERCIAL: 'Commercial',
  VILLA: 'Villa',
  SHOWROOM: 'Showroom',
  APARTMENT: 'Apartment',
  LAND: 'Land'
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BOOKED: 'bg-amber-50 text-amber-700 border-amber-200',
  SOLD: 'bg-red-50 text-red-700 border-red-200',
  UPCOMING: 'bg-sky-50 text-sky-700 border-sky-200',
};

const PROPERTY_STATUSES = [
  { value: 'AVAILABLE', label: 'Available', icon: '🟢' },
  { value: 'BOOKED', label: 'Booked', icon: '🟡' },
  { value: 'SOLD', label: 'Sold', icon: '🔴' },
  { value: 'UPCOMING', label: 'Upcoming', icon: '🔵' },
] as const;

type ApprovalTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TAB_CONFIG: { id: ApprovalTab; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' }
];

function ApprovalBadge({ status }: { status?: string }) {
  if (!status || status === 'APPROVED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
        <CheckCircle className="w-3 h-3" /> Approved
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  );
}

function PropertyImageBanner({ property, isPublicSubmission }: { property: ListingProperty; isPublicSubmission: boolean }) {
  const [hasError, setHasError] = useState(false);

  const rawImage =
    property.heroImage ||
    property.gallery?.[0]?.url ||
    (typeof property.gallery?.[0] === 'string' ? (property.gallery[0] as unknown as string) : '');

  const candidateImage =
    !hasError && rawImage && typeof rawImage === 'string' && rawImage.trim().length > 4
      ? rawImage.trim()
      : null;

  return (
    <div className="h-40 bg-[#E8F0EC] relative overflow-hidden group/img">
      {candidateImage ? (
        <img
          src={candidateImage}
          alt=""
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-[#0B4F3C]/40 bg-gradient-to-br from-[#E8F0EC] to-[#dbeef3]">
          <Home className="w-10 h-10 text-[#0B4F3C]/30" />
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#0B4F3C]/60">
            No Image Uploaded
          </span>
        </div>
      )}

      {/* Property Type Badge */}
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[10px] font-extrabold text-[#0B4F3C] shadow-sm border border-[#0B4F3C]/10">
        {TYPE_LABEL[property.propertyType] || property.propertyType}
      </span>

      {/* Public Submission Badge */}
      {isPublicSubmission && (
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-extrabold shadow-sm">
          PUBLIC
        </span>
      )}
    </div>
  );
}

interface KycModalProps {
  property: ListingProperty;
  onClose: () => void;
  onApprove: (property: ListingProperty) => void;
  onReject: (property: ListingProperty) => void;
}

function KycModal({ property, onClose, onApprove, onReject }: KycModalProps) {
  const kyc = property.kycInfo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#0B4F3C]/20 w-full max-w-xl p-6 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0EC] flex items-center justify-center text-[#0B4F3C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#171A18]">Listing KYC & Verification</h3>
              <p className="text-xs text-[#171A18]/60 truncate max-w-sm">{property.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[#171A18]/40 hover:text-[#171A18] rounded-xl hover:bg-[#E8F0EC] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!kyc || !kyc.fullName ? (
          <div className="py-8 text-center space-y-2">
            <FileText className="w-8 h-8 text-[#171A18]/30 mx-auto" />
            <p className="text-xs font-bold text-[#171A18]/60">No explicit KYC document attached</p>
            <p className="text-[11px] text-[#171A18]/40">This listing was created directly via admin panel or legacy route.</p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
            {/* Owner Identity */}
            <div className="bg-[#FDFCF0] border border-[#0B4F3C]/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0B4F3C] uppercase text-[10px] tracking-wider">Owner / Submitter Identity</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {kyc.verifiedStatus || 'PENDING'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#171A18]/50">Full Legal Name</p>
                  <p className="font-bold text-[#171A18] text-sm">{kyc.fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#171A18]/50">Government ID ({kyc.idType})</p>
                  <p className="font-mono font-bold text-[#171A18] text-sm">{kyc.idNumber || '—'}</p>
                </div>
              </div>
              {kyc.idDocumentUrl && (
                <a
                  href={kyc.idDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#0B4F3C]/20 text-[#0B4F3C] font-bold hover:bg-[#0B4F3C] hover:text-white transition-colors text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View ID Document Proof
                </a>
              )}
            </div>

            {/* Property Ownership Info */}
            <div className="bg-[#FDFCF0] border border-[#0B4F3C]/10 rounded-2xl p-4 space-y-3">
              <span className="font-bold text-[#0B4F3C] uppercase text-[10px] tracking-wider">Property Title & Ownership</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#171A18]/50">Ownership Category</p>
                  <p className="font-bold text-[#171A18]">{kyc.ownershipType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#171A18]/50">Property Tax / Khata ID</p>
                  <p className="font-mono font-bold text-[#171A18]">{kyc.propertyTaxId || '—'}</p>
                </div>
              </div>
              {kyc.ownershipDocumentUrl ? (
                <a
                  href={kyc.ownershipDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#0B4F3C]/20 text-[#0B4F3C] font-bold hover:bg-[#0B4F3C] hover:text-white transition-colors text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View Title Deed / Registry Proof
                </a>
              ) : (
                <p className="text-[11px] text-[#171A18]/50 italic">No deed document file uploaded</p>
              )}
            </div>

            {/* Contact details */}
            <div className="bg-[#FDFCF0] border border-[#0B4F3C]/10 rounded-2xl p-4 space-y-2">
              <span className="font-bold text-[#0B4F3C] uppercase text-[10px] tracking-wider">Contact & Declaration</span>
              <p className="text-[#171A18]">Phone: <span className="font-bold">{property.contactPhone || '—'}</span></p>
              <p className="text-[#171A18]">Email: <span className="font-bold">{property.contactEmail || '—'}</span></p>
              <div className="flex items-center gap-2 pt-1 text-emerald-700">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-[11px]">Self-declaration signed under legal penalty</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#0B4F3C]/15">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#0B4F3C]/20 text-xs font-bold text-[#171A18] cursor-pointer">
            Close
          </button>
          {property.source === 'PUBLIC' && property.approvalStatus === 'PENDING' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onClose(); onReject(property); }}
                className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors cursor-pointer"
              >
                Reject Listing
              </button>
              <button
                onClick={() => { onClose(); onApprove(property); }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" /> Approve Listing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RejectModalProps {
  property: ListingProperty;
  onClose: () => void;
  onDone: () => void;
}

function RejectModal({ property, onClose, onDone }: RejectModalProps) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await rejectProperty(property._id, reason);
      toast.success('Property rejected');
      onDone();
    } catch (e: any) {
      toast.error(e?.friendlyMessage || 'Failed to reject property');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-[#0B4F3C]/20 w-full max-w-md p-6 space-y-4 shadow-2xl">
        <h3 className="font-serif text-lg font-bold text-[#171A18]">Reject Property</h3>
        <p className="text-xs text-[#171A18]/70 font-semibold">"{property.title}"</p>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#171A18]/70">Rejection Reason (optional)</label>
          <textarea
            className="w-full border border-[#0B4F3C]/20 rounded-xl p-3 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C] resize-none"
            rows={3}
            placeholder="Describe why this property is being rejected..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#0B4F3C]/20 text-xs font-bold text-[#171A18] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const PropertiesPage: React.FC = () => {
  const toast = useToast();
  const [properties, setProperties] = useState<ListingProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<ListingProperty | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ListingProperty | null>(null);
  const [kycTarget, setKycTarget] = useState<ListingProperty | null>(null);
  const [activeTab, setActiveTab] = useState<ApprovalTab>('ALL');
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchProperties();
      setProperties(data);
    } catch (e: any) {
      setError(e?.friendlyMessage || 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this property listing? Township project and plots stay intact.')) return;
    try {
      await deleteProperty(id);
      toast.success('Property deleted');
      load();
    } catch (e: any) {
      toast.error(e?.friendlyMessage || 'Failed to delete property');
    }
  };

  const handleApprove = async (property: ListingProperty) => {
    try {
      await approveProperty(property._id);
      toast.success('Property approved and now live!');
      load();
    } catch (e: any) {
      toast.error(e?.friendlyMessage || 'Failed to approve property');
    }
  };

  const handleStatusUpdate = async (property: ListingProperty, newStatus: 'AVAILABLE' | 'BOOKED' | 'SOLD' | 'UPCOMING') => {
    if (property.status === newStatus) return;
    setStatusUpdating(property._id);
    try {
      await updatePropertyStatus(property._id, newStatus);
      toast.success(`Property marked as ${newStatus}`);
      load();
    } catch (e: any) {
      toast.error(e?.friendlyMessage || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  // Tab counts
  const counts = useMemo(() => ({
    ALL: properties.length,
    PENDING: properties.filter((p) => p.approvalStatus === 'PENDING').length,
    APPROVED: properties.filter((p) => !p.approvalStatus || p.approvalStatus === 'APPROVED').length,
    REJECTED: properties.filter((p) => p.approvalStatus === 'REJECTED').length,
  }), [properties]);

  const filteredProperties = useMemo(() => {
    if (activeTab === 'ALL') return properties;
    if (activeTab === 'APPROVED') return properties.filter((p) => !p.approvalStatus || p.approvalStatus === 'APPROVED');
    return properties.filter((p) => p.approvalStatus === activeTab);
  }, [properties, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Property Listings</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Separate from township projects — plots stay under Projects / Plot Inventory</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] cursor-pointer" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsAddOpen(true)} className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] text-white font-bold text-xs flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> Create Property
          </button>
        </div>
      </div>

      {/* Approval Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#E8F0EC]/60 rounded-xl p-1 w-fit border border-[#0B4F3C]/10">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0B4F3C] text-white shadow-sm'
                : 'text-[#171A18]/60 hover:text-[#171A18]'
            }`}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[#0B4F3C]/10 text-[#0B4F3C]'
              }`}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && !isLoading && filteredProperties.length === 0 && (
        <EmptyState
          icon={Home}
          title={activeTab === 'PENDING' ? 'No pending submissions' : 'No property listings'}
          description={
            activeTab === 'PENDING'
              ? 'All public property submissions have been reviewed.'
              : 'Create residential plots, commercial units, villas or showrooms. These are not township projects.'
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProperties.map((property) => {
          const projectName = typeof property.projectId === 'object' && property.projectId
            ? property.projectId.name
            : '';
          const isPublicSubmission = property.source === 'PUBLIC';
          const isPending = property.approvalStatus === 'PENDING';
          return (
            <article key={property._id} className={`bg-white border rounded-3xl overflow-hidden shadow-sm ${isPending ? 'border-amber-300' : 'border-[#0B4F3C]/10'}`}>
              <PropertyImageBanner property={property} isPublicSubmission={isPublicSubmission} />
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif font-bold text-[#171A18] leading-snug flex-1">{property.title}</h3>
                  <ApprovalBadge status={property.approvalStatus} />
                </div>
                <p className="text-xs text-[#171A18]/60">{[property.location, property.city].filter(Boolean).join(', ') || 'Location pending'}</p>
                {projectName && <p className="text-[10px] font-bold text-[#0B4F3C]">Linked project: {projectName}</p>}
                {property.approvalStatus === 'REJECTED' && property.rejectionReason && (
                  <p className="text-[10px] text-red-600 font-semibold bg-red-50 rounded-lg px-2 py-1">
                    Reason: {property.rejectionReason}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-extrabold text-[#0B4F3C]">
                    {property.priceRange || (property.price ? `₹${property.price.toLocaleString('en-IN')}` : 'Price on request')}
                  </span>
                  {/* Status Quick-Change Dropdown */}
                  <div className="relative group/status">
                    <button
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold cursor-pointer ${STATUS_COLORS[property.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                      title="Click to change status"
                      disabled={statusUpdating === property._id}
                    >
                      {statusUpdating === property._id ? 'Updating…' : property.status}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#0B4F3C]/20 rounded-xl shadow-xl z-20 overflow-hidden hidden group-hover/status:block">
                      {PROPERTY_STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => handleStatusUpdate(property, s.value)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 ${
                            property.status === s.value
                              ? 'bg-[#E8F0EC] text-[#0B4F3C]'
                              : 'text-[#171A18] hover:bg-[#E8F0EC]/60'
                          }`}
                        >
                          <span>{s.icon}</span> {s.label}
                          {property.status === s.value && <CheckCircle className="w-3 h-3 ml-auto text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-[#171A18]/50">{property.gallery?.length || 0} gallery photos</p>

                {/* Approve / Reject buttons for pending public submissions */}
                {isPublicSubmission && isPending && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(property)}
                      className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectTarget(property)}
                      className="flex-1 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {/* KYC / Title Docs — always visible so admin can review for any property */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#0B4F3C]/10">
                  <button
                    onClick={() => setKycTarget(property)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      property.kycInfo?.fullName
                        ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                        : 'bg-[#FDFCF0] text-[#171A18]/50 border border-[#0B4F3C]/10 hover:bg-[#E8F0EC]'
                    }`}
                    title="View KYC Identity & Title Documents"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {property.kycInfo?.fullName ? 'View KYC & Docs' : 'No KYC Filed'}
                  </button>
                  <button onClick={() => setEditing(property)} className="flex-1 px-3 py-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(property._id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {isAddOpen && <AddPropertyModal onClose={() => setIsAddOpen(false)} onSuccess={load} />}
      {editing && <EditPropertyModal property={editing} onClose={() => setEditing(null)} onSuccess={load} />}
      {rejectTarget && (
        <RejectModal
          property={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); load(); }}
        />
      )}
      {kycTarget && (
        <KycModal
          property={kycTarget}
          onClose={() => setKycTarget(null)}
          onApprove={handleApprove}
          onReject={(p) => setRejectTarget(p)}
        />
      )}
    </div>
  );
};
