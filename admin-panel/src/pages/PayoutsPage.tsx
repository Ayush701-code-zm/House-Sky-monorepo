import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Payout, Employee } from '../types';
import { RequestPayoutModal } from '../components/commissions/RequestPayoutModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, RefreshCw, CheckCircle2, CreditCard, Search, DollarSign, Clock, Filter, ShieldAlert } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Mirrors backend: POST /payouts/:id/approve is ADMIN/DIRECTOR only.
const PAYOUT_APPROVER_ROLES = ['ADMIN', 'DIRECTOR'];

export const PayoutsPage: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const canApprovePayouts = Boolean(user && PAYOUT_APPROVER_ROLES.includes(user.role));
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kycEligible, setKycEligible] = useState<boolean>(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchPayoutsAndAgents();
  }, []);

  const fetchPayoutsAndAgents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [payRes, empRes, kycRes] = await Promise.all([
        api.get('/payouts'),
        api.get('/employees'),
        api.get('/kyc/me').catch(() => ({ data: { payoutEligible: false } }))
      ]);
      setPayouts(payRes.data || []);
      setEmployees(empRes.data || []);
      setKycEligible(Boolean(kycRes.data?.payoutEligible));
    } catch (e: any) {
      console.error(e);
      setError(e?.friendlyMessage || 'Failed to fetch payouts list.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/payouts/${id}/approve`);
      toast.success('Payout approved & processed! Multi-channel notification dispatched to agent.');
      fetchPayoutsAndAgents();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.friendlyMessage || 'Failed to approve payout');
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const agentName = p.employeeId?.userId?.fullName || '';
    const refNo = p.referenceNo || '';
    const matchesSearch =
      agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refNo.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const totalDisbursed = payouts
    .filter((p) => p.status === 'COMPLETED' || p.status === 'PROCESSING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);


  const totalPending = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingCount = payouts.filter((p) => p.status === 'PENDING').length;

  // Reset page on filter/search change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter]);

  const paginatedPayouts = filteredPayouts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Agent Earnings Payouts & Disbursements</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Disburse calculated commissions and send multi-channel notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPayoutsAndAgents}
            className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            title="Refresh Payouts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#0B4F3C]"
          >
            <Plus className="w-4 h-4" /> Request Payout
          </button>
        </div>
      </div>

      {!kycEligible ? (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <div>
              <p className="font-bold">KYC approval required for payouts</p>
              <p className="text-[11px] opacity-80 mt-0.5">Fill PAN, Aadhaar and bank details. A manager or admin must approve before you can request a payout.</p>
            </div>
          </div>
          <Link to="/kyc" className="px-3.5 py-1.5 rounded-xl bg-amber-700 text-white font-bold">
            Complete My KYC
          </Link>
        </div>
      ) : null}

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Total Disbursed</p>
            <h3 className="text-2xl font-serif font-bold text-[#0B4F3C] mt-0.5">{formatCurrency(totalDisbursed, { compact: true })}</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Approved & paid to bank</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center font-bold shadow-md">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Pending Disbursal</p>
            <h3 className="text-2xl font-serif font-bold text-amber-700 mt-0.5">{formatCurrency(totalPending, { compact: true })}</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">{pendingCount} requests awaiting approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Total Requests</p>
            <h3 className="text-2xl font-serif font-bold text-[#171A18] mt-0.5">{payouts.length} Requests</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Across active downlines</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center font-bold shadow-md">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0B4F3C]" />
          <span className="text-xs font-bold text-[#171A18]/70">Status:</span>
          {['ALL', 'PENDING', 'COMPLETED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0B4F3C] text-white border-[#0B4F3C]'
                  : 'bg-[#FDFCF0] text-[#0B4F3C] border-[#0B4F3C]/20 hover:bg-[#E8F0EC]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#0B4F3C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Agent name or Ref No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] w-64"
          />
        </div>
      </div>

      {/* Payouts Directory Table */}
      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : error ? (
        <ErrorState title="Payouts Ledger Load Failed" message={error} onRetry={fetchPayoutsAndAgents} />
      ) : filteredPayouts.length === 0 ? (
        <EmptyState
          title="No Payouts Found"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No payout requests match your filter criteria.'
              : 'Click "Request Payout" to submit a disbursement request for an active agent.'
          }
          icon={CreditCard}
          actionLabel="Request Payout"
          onAction={() => setIsRequestModalOpen(true)}
        />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#171A18]">
              <thead className="bg-[#E8F0EC] text-[#0B4F3C] uppercase text-[10px] font-bold border-b border-[#0B4F3C]/15">
                <tr>
                  <th className="p-3">Reference No</th>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Payout Amount</th>
                  <th className="p-3">Request Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0B4F3C]/10">
                {paginatedPayouts.map((p) => (
                  <tr key={p._id} className="hover:bg-[#E8F0EC]/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0B4F3C]">{p.referenceNo || 'PAY-REF'}</td>
                    <td className="p-3 font-bold text-[#171A18]">{p.employeeId?.userId?.fullName || 'Agent'}</td>
                    <td className="p-3 font-extrabold text-[#0B4F3C]">{formatCurrency(p.amount)}</td>
                    <td className="p-3 text-[#171A18]/70">{formatDate(p.payoutDate)}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        p.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30' : 'bg-amber-500/20 text-amber-800 border-amber-500/30'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.status === 'PENDING' && !canApprovePayouts ? (
                        <span className="text-amber-700 text-[10px] font-bold">Awaiting approval</span>
                      ) : p.status === 'PENDING' ? (
                        <button
                          onClick={() => handleApprove(p._id)}
                          className="px-3 py-1 bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold rounded-lg text-xs shadow-md flex items-center gap-1 cursor-pointer border border-[#0B4F3C]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Pay
                        </button>
                      ) : (
                        <span className="text-[#0B4F3C] text-[10px] font-bold">✔ Disbursed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredPayouts.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            label="payouts"
          />
        </div>
      )}

      {/* Request Payout Modal */}
      {isRequestModalOpen && (
        <RequestPayoutModal
          employees={employees}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={fetchPayoutsAndAgents}
        />
      )}
    </div>
  );
};
