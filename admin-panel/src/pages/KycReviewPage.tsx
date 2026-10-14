import React, { useEffect, useState } from 'react';
import { CheckCircle2, Eye, FileText, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import api from '../services/api';
import { AgentKyc, KycStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

const STATUS_ALL = 'ALL';
const STATUS_SUBMITTED: KycStatus = 'SUBMITTED';
const STATUS_APPROVED: KycStatus = 'APPROVED';
const STATUS_REJECTED: KycStatus = 'REJECTED';
const STATUS_DRAFT: KycStatus = 'DRAFT';
const FILTERS = [STATUS_ALL, STATUS_SUBMITTED, STATUS_APPROVED, STATUS_REJECTED, STATUS_DRAFT];

function employeeName(kyc: AgentKyc): string {
  const populated = kyc.employeeId && typeof kyc.employeeId === 'object' ? kyc.employeeId : null;
  if (populated?.userId?.fullName) return populated.userId.fullName;
  const parts = [kyc.firstName, kyc.middleName, kyc.surname].filter(Boolean);
  return parts.join(' ') || 'Agent';
}

function employeeCodeOf(kyc: AgentKyc): string {
  const populated = kyc.employeeId && typeof kyc.employeeId === 'object' ? kyc.employeeId : null;
  return populated?.employeeCode || '—';
}

function statusClass(status: KycStatus): string {
  if (status === STATUS_APPROVED) return 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30';
  if (status === STATUS_SUBMITTED) return 'bg-amber-500/20 text-amber-800 border-amber-500/30';
  if (status === STATUS_REJECTED) return 'bg-red-500/20 text-red-800 border-red-500/30';
  return 'bg-[#E8F0EC] text-[#0B4F3C] border-[#0B4F3C]/20';
}

export const KycReviewPage: React.FC = () => {
  const toast = useToast();
  const [records, setRecords] = useState<AgentKyc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_SUBMITTED);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<AgentKyc | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isActing, setIsActing] = useState(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = statusFilter === STATUS_ALL ? {} : { status: statusFilter };
      const res = await api.get('/kyc', { params });
      setRecords(res.data || []);
    } catch (err: any) {
      setError(err?.friendlyMessage || 'Failed to load KYC queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filtered = records.filter((kyc) => {
    const haystack = `${employeeName(kyc)} ${employeeCodeOf(kyc)} ${kyc.panNumber || ''} ${kyc.mobile || ''}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  const approve = async (id: string) => {
    setIsActing(true);
    try {
      await api.post(`/kyc/${id}/approve`);
      toast.success('KYC approved. Agent can now request payouts.');
      setSelected(null);
      fetchRecords();
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Failed to approve KYC');
    } finally {
      setIsActing(false);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) {
      toast.error('Enter a rejection reason');
      return;
    }
    setIsActing(true);
    try {
      await api.post(`/kyc/${id}/reject`, { reason: rejectReason.trim() });
      toast.info('KYC sent back to the agent');
      setSelected(null);
      setRejectReason('');
      fetchRecords();
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Failed to reject KYC');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">KYC Approvals</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Review agent identity and bank details before payouts are allowed.</p>
        </div>
        <button
          onClick={fetchRecords}
          className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C]"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                statusFilter === status
                  ? 'bg-[#0B4F3C] text-white border-[#0B4F3C]'
                  : 'bg-[#FDFCF0] text-[#0B4F3C] border-[#0B4F3C]/20'
              }`}
            >
              {status === STATUS_ALL ? 'All' : status}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-[#0B4F3C] absolute left-3 top-2.5" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, code, PAN..."
            className="pl-9 pr-4 py-2 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl text-xs font-bold w-64 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <ErrorState title="KYC queue failed" message={error} onRetry={fetchRecords} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No KYC records"
          description="Submitted agent KYC forms will appear here for manager and admin review."
          icon={ShieldCheck}
        />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F0EC] text-[#0B4F3C] uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3">Agent</th>
                <th className="p-3">PAN / Aadhaar</th>
                <th className="p-3">Bank</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0B4F3C]/10">
              {filtered.map((kyc) => (
                <tr key={kyc._id} className="hover:bg-[#E8F0EC]/40">
                  <td className="p-3">
                    <p className="font-bold text-[#171A18]">{employeeName(kyc)}</p>
                    <p className="font-mono text-[#0B4F3C]">{employeeCodeOf(kyc)}</p>
                  </td>
                  <td className="p-3 font-mono">
                    <p>{kyc.panNumber || '—'}</p>
                    <p className="text-[#171A18]/60">{kyc.aadhaarNumber ? `XXXX XXXX ${kyc.aadhaarNumber.slice(-4)}` : '—'}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold">{kyc.bankName || '—'}</p>
                    <p className="font-mono text-[#171A18]/60">{kyc.ifscCode || ''}</p>
                  </td>
                  <td className="p-3">{kyc.submittedAt ? formatDate(kyc.submittedAt) : '—'}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${statusClass(kyc.status)}`}>
                      {kyc.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelected(kyc);
                        setRejectReason('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#E8F0EC] text-[#0B4F3C] text-[11px] font-bold"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-serif font-bold">{employeeName(selected)}</h3>
                <p className="text-xs text-[#171A18]/60">{employeeCodeOf(selected)} · {selected.status}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs font-bold text-[#171A18]/60">Close</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <Detail label="Full name" value={`${selected.firstName} ${selected.middleName} ${selected.surname}`.replace(/\s+/g, ' ')} />
              <Detail label="Date of birth" value={selected.dateOfBirth ? formatDate(selected.dateOfBirth) : '—'} />
              <Detail label="Mobile" value={selected.mobile} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Address" value={selected.address} />
              <Detail label="PAN" value={selected.panNumber} />
              <Detail label="Aadhaar" value={selected.aadhaarNumber} />
              <Detail label="Account holder" value={selected.accountHolderName} />
              <Detail label="Account number" value={selected.accountNumber} />
              <Detail label="IFSC" value={selected.ifscCode} />
              <Detail label="Bank / Branch" value={`${selected.bankName} · ${selected.branchName}`} />
              <Detail label="Nominee" value={selected.nomineeName || '—'} />
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {selected.panDocUrl ? (
                <a href={selected.panDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#0B4F3C]/20 font-bold text-[#0B4F3C]">
                  <FileText className="w-3.5 h-3.5" /> PAN document
                </a>
              ) : null}
              {selected.aadhaarDocUrl ? (
                <a href={selected.aadhaarDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#0B4F3C]/20 font-bold text-[#0B4F3C]">
                  <FileText className="w-3.5 h-3.5" /> Aadhaar document
                </a>
              ) : null}
            </div>

            {selected.status === STATUS_SUBMITTED ? (
              <div className="space-y-3 pt-2 border-t border-[#0B4F3C]/10">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason (required if sending back)"
                  className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-xs min-h-[72px]"
                />
                <div className="flex gap-2">
                  <button
                    disabled={isActing}
                    onClick={() => selected._id && approve(selected._id)}
                    className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve KYC
                  </button>
                  <button
                    disabled={isActing}
                    onClick={() => selected._id && reject(selected._id)}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Send back
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Detail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-[#FDFCF0] rounded-xl px-3 py-2 border border-[#0B4F3C]/10">
    <p className="text-[10px] uppercase font-bold text-[#171A18]/50">{label}</p>
    <p className="font-semibold text-[#171A18] mt-0.5 break-all">{value || '—'}</p>
  </div>
);
