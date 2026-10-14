import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { formatDate } from '../utils/formatters';
import {
  PackageSearch,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  X,
  Eye,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface BulkDealRequest {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  propertyTitle?: string;
  unitCount?: number;
  budgetRange?: string;
  city?: string;
  state?: string;
  message?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'CONTACTED' | 'CONVERTED' | 'REJECTED';
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800 border-amber-300',
  IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-300',
  CONTACTED: 'bg-purple-100 text-purple-800 border-purple-300',
  CONVERTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300'
};

const STATUS_OPTIONS = ['NEW', 'IN_PROGRESS', 'CONTACTED', 'CONVERTED', 'REJECTED'];

export const BulkDealRequestsPage: React.FC = () => {
  const toast = useToast();
  const [requests, setRequests] = useState<BulkDealRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BulkDealRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/bulk-buy-inquiries');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      setError(e?.friendlyMessage || 'Failed to load bulk deal requests');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/bulk-buy-inquiries/${id}/status`, { status });
      toast.success(`Request status updated to ${status}`);
      setRequests((prev) => prev.map((r) => r._id === id ? { ...r, status: status as any } : r));
      if (selected?._id === id) setSelected((s) => s ? { ...s, status: status as any } : null);
    } catch (e: any) {
      toast.error(e?.friendlyMessage || 'Failed to update status');
    }
  };

  const filtered = requests.filter((r) => statusFilter === 'ALL' || r.status === statusFilter);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  React.useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  // KPI Counts
  const countNew = requests.filter((r) => r.status === 'NEW').length;
  const countActive = requests.filter((r) => ['IN_PROGRESS', 'CONTACTED'].includes(r.status)).length;
  const countConverted = requests.filter((r) => r.status === 'CONVERTED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Bulk Deal Requests</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">
            Investor enquiries submitted via landing page bulk deal forms
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">New / Unread</p>
            <h3 className="text-2xl font-serif font-bold text-amber-800 mt-0.5">{countNew} Requests</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Awaiting first contact</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-serif font-bold text-sky-800 mt-0.5">{countActive} Active</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Being followed up</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Converted</p>
            <h3 className="text-2xl font-serif font-bold text-emerald-800 mt-0.5">{countConverted} Deals</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Successfully closed</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#E8F0EC]/60 rounded-xl p-1 w-fit border border-[#0B4F3C]/10 flex-wrap">
        {['ALL', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === s ? 'bg-[#0B4F3C] text-white shadow-sm' : 'text-[#171A18]/60 hover:text-[#171A18]'
            }`}
          >
            {s} {s !== 'ALL' && <span className="ml-1 opacity-70">({requests.filter((r) => r.status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <ErrorState title="Load Failed" message={error} onRetry={fetchRequests} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No Bulk Deal Requests Yet"
          description={statusFilter !== 'ALL' ? `No requests with status "${statusFilter}".` : 'When investors request bulk deals from your landing page, they will appear here.'}
        />
      ) : (
        <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#E8F0EC] text-[#0B4F3C] uppercase text-[10px] font-bold border-b border-[#0B4F3C]/15">
                <tr>
                  <th className="px-4 py-3.5">Investor Details</th>
                  <th className="px-4 py-3.5">Deal / Property</th>
                  <th className="px-4 py-3.5">Units & Budget</th>
                  <th className="px-4 py-3.5">City & State</th>
                  <th className="px-4 py-3.5">Submitted</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0B4F3C]/10">
                {paginated.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-[#E8F0EC]/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(req)}
                  >
                    <td className="px-4 py-4">
                      <p className="font-bold text-[#171A18]">{req.name}</p>
                      <p className="text-[#171A18]/60 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-[#0B4F3C]" /> {req.phone}
                      </p>
                      {req.email && (
                        <p className="text-[#171A18]/60 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#0B4F3C]" /> {req.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#171A18] max-w-[150px] truncate">
                        {req.propertyTitle || 'General Bulk Deal'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {req.unitCount && (
                        <span className="px-2 py-0.5 bg-[#E8F0EC] text-[#0B4F3C] rounded-full font-bold text-[10px] flex items-center gap-1 w-fit">
                          <Layers className="w-3 h-3" /> {req.unitCount} units
                        </span>
                      )}
                      {req.budgetRange && <p className="text-[#171A18]/60 mt-0.5">{req.budgetRange}</p>}
                    </td>
                    <td className="px-4 py-4">
                      {req.city || req.state ? (
                        <span className="flex items-center gap-1 text-[#171A18]/70">
                          <MapPin className="w-3 h-3 text-[#0B4F3C]" /> {req.city || ''}{req.city && req.state ? `, ` : ''}{req.state || ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-4 text-[#171A18]/60 font-mono text-[10px]">
                      {formatDate(req.createdAt, { includeTime: true, fallback: 'Just now' })}
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusUpdate(req._id, e.target.value)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer focus:outline-none ${STATUS_STYLES[req.status] || ''}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(req); }}
                        className="px-3 py-1.5 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors text-[11px] font-bold flex items-center gap-1.5 ml-auto cursor-pointer border border-[#0B4F3C]/20"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 pb-4 pt-2">
            <Pagination
              totalItems={filtered.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              label="requests"
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-[#0B4F3C]/20 shadow-2xl w-full max-w-lg p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#171A18]">{selected.name}</h3>
                  <p className="text-[10px] text-[#171A18]/60 font-mono">
                    Request #{selected._id.slice(-6).toUpperCase()} · {formatDate(selected.createdAt, { includeTime: true })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Phone</p>
                <p className="font-bold text-[#171A18] mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0B4F3C]" /> {selected.phone}
                </p>
              </div>
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Email</p>
                <p className="font-bold text-[#171A18] mt-0.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0B4F3C]" /> {selected.email || '—'}
                </p>
              </div>
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Deal / Property</p>
                <p className="font-bold text-[#171A18] mt-0.5">{selected.propertyTitle || 'General Bulk Deal'}</p>
              </div>
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Location (City, State)</p>
                <p className="font-bold text-[#171A18] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0B4F3C]" /> {selected.city || ''}{selected.city && selected.state ? `, ` : ''}{selected.state || '—'}
                </p>
              </div>
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Units Requested</p>
                <p className="font-bold text-[#171A18] mt-0.5 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#0B4F3C]" /> {selected.unitCount || '—'} units
                </p>
              </div>
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Budget Range</p>
                <p className="font-bold text-[#171A18] mt-0.5">{selected.budgetRange || '—'}</p>
              </div>
            </div>

            {selected.message && (
              <div className="bg-[#E8F0EC]/50 p-4 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#0B4F3C] font-bold uppercase mb-1">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                  Investor Message
                </p>
                <p className="text-xs text-[#171A18] leading-relaxed italic">{selected.message}</p>
              </div>
            )}

            {/* Status Update */}
            <div className="flex items-center justify-between pt-2 border-t border-[#0B4F3C]/15">
              <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${STATUS_STYLES[selected.status]}`}>
                {selected.status}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#171A18]/70">Update Status:</span>
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusUpdate(selected._id, e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#0B4F3C]/30 bg-white cursor-pointer focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDealRequestsPage;
