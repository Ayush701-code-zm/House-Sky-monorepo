import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Commission } from '../types';
import { StatsCardSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency } from '../utils/formatters';
import { CheckCircle2, Clock, DollarSign, RefreshCw } from 'lucide-react';

export const CommissionsPage: React.FC = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedCommissions = commissions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, sumRes] = await Promise.all([
        api.get('/commissions'),
        api.get('/commissions/summary')
      ]);
      setCommissions(listRes.data || []);
      setSummary(sumRes.data || null);
    } catch (e: any) {
      console.error(e);
      setError(e?.friendlyMessage || 'Failed to load commissions ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Differential Commission Ledger</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Multi-tier commission distribution logs generated from plot sales</p>
        </div>
        <button
          onClick={fetchCommissions}
          className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
          title="Refresh Commissions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <StatsCardSkeleton count={2} />
          <TableSkeleton rows={6} columns={8} />
        </div>
      ) : error ? (
        <ErrorState title="Commissions Ledger Load Failed" message={error} onRetry={fetchCommissions} />
      ) : (
        <>
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/15 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-[#171A18]/70 font-semibold">Total Commissions Paid</p>
                  <h3 className="text-2xl font-serif font-bold text-[#0B4F3C] mt-1">{formatCurrency(summary.totalPaid, { allowZero: true })}</h3>
                </div>
                <CheckCircle2 className="w-8 h-8 text-[#0B4F3C]" />
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/15 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs text-[#171A18]/70 font-semibold">Commissions Pending Payout</p>
                  <h3 className="text-2xl font-serif font-bold text-amber-700 mt-1">{formatCurrency(summary.totalPending, { allowZero: true })}</h3>
                </div>
                <Clock className="w-8 h-8 text-amber-700" />
              </div>
            </div>
          )}

          {commissions.length === 0 ? (
            <EmptyState
              title="No Commissions Calculated Yet"
              description="Commission records will be generated automatically when plot sales are marked as SOLD."
              icon={DollarSign}
            />
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#171A18]">
                  <thead className="bg-[#E8F0EC] text-[#0B4F3C] uppercase text-[10px] font-bold border-b border-[#0B4F3C]/15">
                    <tr>
                      <th className="p-3">Agent</th>
                      <th className="p-3">Rank at Sale</th>
                      <th className="p-3">Plot</th>
                      <th className="p-3">Sale Amount</th>
                      <th className="p-3">Rank Rate</th>
                      <th className="p-3">Diff Rate</th>
                      <th className="p-3">Commission Earned</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0B4F3C]/10">
                    {paginatedCommissions.map((comm) => (
                      <tr key={comm._id} className="hover:bg-[#E8F0EC]/40 transition-colors">
                        <td className="p-3 font-bold text-[#171A18]">{comm.employeeId?.userId?.fullName || 'Agent'}</td>
                        <td className="p-3 text-[#0B4F3C] font-semibold">{comm.rankAtSale || 'Advisor'}</td>
                        <td className="p-3 font-mono font-bold text-[#0B4F3C]">{comm.plotId ? comm.plotId.plotNo : 'Plot'}</td>
                        <td className="p-3">{formatCurrency(comm.saleAmount)}</td>
                        <td className="p-3">{comm.commissionRate ?? 0}%</td>
                        <td className="p-3 font-bold text-amber-700">{comm.differentialRate ?? 0}%</td>
                        <td className="p-3 font-extrabold text-[#0B4F3C]">{formatCurrency(comm.commissionAmount)}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                            comm.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30' : 'bg-amber-500/20 text-amber-800 border-amber-500/30'
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                totalItems={commissions.length}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
                label="commissions"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
