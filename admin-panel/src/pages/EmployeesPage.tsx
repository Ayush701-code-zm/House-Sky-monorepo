import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Employee, RANKS } from '../types';
import { AddEmployeeModal } from '../components/employees/AddEmployeeModal';
import { InviteLinkCard } from '../components/employees/InviteLinkCard';
import { AgentProfileModal } from '../components/employees/AgentProfileModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { formatNumber } from '../utils/formatters';
import { UserPlus, Trash2, RefreshCw, Search, Users, Award, TrendingUp, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const EmployeesPage: React.FC = () => {
  const toast = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/employees');
      setEmployees(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.friendlyMessage || 'Failed to fetch employees directory.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAgent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/employees/${id}/approve`);
      toast.success(res.data.message || 'Agent approved and activated!');
      fetchEmployees();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.friendlyMessage || 'Failed to approve agent');
    }
  };

  const handleRejectAgent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to reject this agent application?')) return;
    try {
      const res = await api.post(`/employees/${id}/reject`);
      toast.info(res.data.message || 'Agent application rejected');
      fetchEmployees();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.friendlyMessage || 'Failed to reject agent application');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this agent and remove them from the network tree?')) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Agent deleted successfully');
      fetchEmployees();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.friendlyMessage || 'Failed to delete agent');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const name = emp.userId?.fullName || '';
    const email = emp.userId?.email || '';
    const phone = emp.userId?.phone || '';
    const code = emp.employeeCode || '';
    const status = (emp.userId as any)?.approvalStatus || 'APPROVED';

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRank = rankFilter === 'ALL' || emp.currentRank === rankFilter;
    const matchesApproval = approvalFilter === 'ALL' || status === approvalFilter;

    return matchesSearch && matchesRank && matchesApproval;
  });

  const totalAgents = employees.length;
  const pendingApprovalsCount = employees.filter((e) => (e.userId as any)?.approvalStatus === 'PENDING_APPROVAL').length;
  const directorsCount = employees.filter(
    (e) => e.currentRank === 'Director Sales' || e.currentRank === 'Associate Sales Director'
  ).length;
  const totalSelfSales = employees.reduce((sum, e) => sum + (e.selfSalesCount || 0), 0);

  // Reset page on filter/search change
  React.useEffect(() => { setCurrentPage(1); }, [searchQuery, rankFilter, approvalFilter]);

  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Title & Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">MLM Sales Executives & Directory</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Manage team members, downline sponsors, and public agent application approvals</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEmployees}
            className="p-2.5 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#0B4F3C]"
          >
            <UserPlus className="w-4 h-4" /> Add New Agent (Direct Onboarding)
          </button>
        </div>
      </div>

      <InviteLinkCard />

      {/* Pending Agent Applications Banner */}
      {pendingApprovalsCount > 0 && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Pending Public Agent Applications ({pendingApprovalsCount})</p>
              <p className="text-[11px] opacity-80 mt-0.5">Public site applicants require Admin/Manager approval before logging in.</p>
            </div>
          </div>
          <button
            onClick={() => setApprovalFilter('PENDING_APPROVAL')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            View Pending ({pendingApprovalsCount})
          </button>
        </div>
      )}

      {/* KPI Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Total Sales Team</p>
            <h3 className="text-2xl font-serif font-bold text-[#171A18] mt-0.5">{formatNumber(totalAgents)} Agents</h3>
            <p className="text-[10px] text-[#171A18]/70 mt-0.5">Across all downlines</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Pending Applications</p>
            <h3 className="text-2xl font-serif font-bold text-amber-700 mt-0.5">{formatNumber(pendingApprovalsCount)} Pending</h3>
            <p className="text-[10px] text-[#171A18]/70 mt-0.5">Requires Admin Approval</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Sales Directors</p>
            <h3 className="text-2xl font-serif font-bold text-[#0B4F3C] mt-0.5">{formatNumber(directorsCount)} Directors</h3>
            <p className="text-[10px] text-[#171A18]/70 mt-0.5">Top tier leadership</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Direct Sales Volume</p>
            <h3 className="text-2xl font-serif font-bold text-[#171A18] mt-0.5">{formatNumber(totalSelfSales)} Plots</h3>
            <p className="text-[10px] text-[#171A18]/70 mt-0.5">Personal conversions</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 p-1 rounded-xl">
            <button
              onClick={() => setApprovalFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                approvalFilter === 'ALL' ? 'bg-[#0B4F3C] text-white' : 'text-[#171A18]/70 hover:text-[#171A18]'
              }`}
            >
              All Agents ({employees.length})
            </button>
            <button
              onClick={() => setApprovalFilter('PENDING_APPROVAL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                approvalFilter === 'PENDING_APPROVAL' ? 'bg-amber-600 text-white' : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              Pending Approval ({pendingApprovalsCount})
            </button>
            <button
              onClick={() => setApprovalFilter('APPROVED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                approvalFilter === 'APPROVED' ? 'bg-emerald-700 text-white' : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              Active Approved
            </button>
          </div>

          <div>
            <select
              value={rankFilter}
              onChange={(e) => setRankFilter(e.target.value)}
              className="bg-[#FDFCF0] border border-[#0B4F3C]/20 text-[#171A18] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#0B4F3C]"
            >
              <option value="ALL">All MLM Ranks</option>
              {RANKS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#0B4F3C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Name, Code, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] w-64"
          />
        </div>
      </div>

      {/* Directory Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : error ? (
        <ErrorState title="Directory Load Failed" message={error} onRetry={fetchEmployees} />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No Agents Found"
          description={
            searchQuery || rankFilter !== 'ALL' || approvalFilter !== 'ALL'
              ? 'No agents match your filter criteria. Try clearing search query or resetting filters.'
              : 'No sales executives or agents are registered in the system yet.'
          }
          icon={Users}
          actionLabel="Add Agent"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#171A18]">
              <thead className="bg-[#E8F0EC] text-[#0B4F3C] uppercase text-[10px] font-bold border-b border-[#0B4F3C]/15">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Phone & Email</th>
                  <th className="p-3">Sponsor Upline</th>
                  <th className="p-3">Current Rank</th>
                  <th className="p-3">Approval Status</th>
                  <th className="p-3">Self Sales</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0B4F3C]/10">
                {paginatedEmployees.map((emp) => {
                  const approvalStatus = (emp.userId as any)?.approvalStatus || 'APPROVED';
                  const isPending = approvalStatus === 'PENDING_APPROVAL';

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedAgentId(emp.id)}
                      className={`transition-colors cursor-pointer group ${
                        isPending ? 'bg-amber-50/60 hover:bg-amber-100/60' : 'hover:bg-[#E8F0EC]/40'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-[#0B4F3C] group-hover:underline">
                        {emp.employeeCode || '—'}
                      </td>
                      <td className="p-3 font-bold text-[#171A18]">
                        {emp.userId ? emp.userId.fullName : 'Executive'}
                      </td>
                      <td className="p-3 text-[#171A18]/70">
                        <p className="font-semibold text-[#171A18]">{emp.userId?.phone || 'N/A'}</p>
                        <p className="text-[10px] text-[#171A18]/60">{emp.userId?.email || 'N/A'}</p>
                      </td>
                      <td className="p-3 text-[#171A18]/70">
                        <div>
                          <p className="font-semibold text-[#171A18] text-[11px]">
                            {emp.parentId && typeof emp.parentId === 'object' && (emp.parentId as any).userId
                              ? (emp.parentId as any).userId.fullName
                              : 'Root / Top Admin'}
                          </p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-[#E8F0EC] text-[#0B4F3C] border border-[#0B4F3C]/30">
                            Leg #{emp.legNumber || 1}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0EC] text-[#0B4F3C] font-bold text-[10px] border border-[#0B4F3C]/20">
                          {emp.currentRank || 'Business Executive'}
                        </span>
                      </td>
                      <td className="p-3">
                        {isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 font-extrabold text-[10px] border border-amber-500/30 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3 text-amber-700" /> Pending Admin Approval
                          </span>
                        ) : approvalStatus === 'REJECTED' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-800 font-extrabold text-[10px] border border-red-500/30">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Active Approved
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-[#171A18]">{formatNumber(emp.selfSalesCount)}</td>
                      <td className="p-3 text-right space-x-1.5">
                        {isPending ? (
                          <>
                            <button
                              onClick={(e) => handleApproveAgent(e, emp.id)}
                              className="px-3 py-1.5 rounded-lg bg-[#0B4F3C] hover:bg-[#063B2D] text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1 border border-[#0B4F3C]"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve Agent
                            </button>
                            <button
                              onClick={(e) => handleRejectAgent(e, emp.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition-colors cursor-pointer border border-red-200"
                              title="Reject Application"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAgentId(emp.id);
                              }}
                              className="p-1.5 rounded-lg bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold px-2.5"
                              title="View Dossier / Promote"
                            >
                              <Eye className="w-3.5 h-3.5" /> Dossier
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, emp.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Agent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredEmployees.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            pageSizeOptions={[10, 15, 25, 50]}
            label="agents"
          />
        </div>
      )}

      {/* Add Agent Modal (Direct Onboarding) */}
      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={fetchEmployees}
        />
      )}

      {/* Agent Performance Dossier & Promotion Modal */}
      {selectedAgentId && (
        <AgentProfileModal
          employeeId={selectedAgentId}
          allEmployees={employees}
          onClose={() => setSelectedAgentId(null)}
          onSuccess={fetchEmployees}
        />
      )}
    </div>
  );
};
