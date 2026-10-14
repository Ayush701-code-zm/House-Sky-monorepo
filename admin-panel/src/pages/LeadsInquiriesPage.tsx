import React, { useState, useEffect } from 'react'
import { inquiriesService } from '../services/inquiriesService'
import { TableSkeleton } from '../components/common/Skeleton'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { Pagination, usePagination } from '../components/common/Pagination'
import { formatDate } from '../utils/formatters'
import {
  MessageSquare,
  Search,
  Filter,
  Phone,
  Mail,
  RefreshCw,
  Inbox,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  X
} from 'lucide-react'

export function LeadsInquiriesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inquiries, setInquiries] = useState<any[]>([])
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null)

  // Pagination — reset to page 1 when filter/search changes
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [data, bulkData] = await Promise.all([
        inquiriesService.getInquiries(),
        inquiriesService.getBulkBuyInquiries().catch(() => [])
      ])
      const formatted = Array.isArray(data)
        ? data.map((inq: any) => ({
          id: inq._id ? `INQ-${inq._id.slice(-6).toUpperCase()}` : (inq.id || 'INQ'),
          rawId: inq._id,
          leadKind: 'INQUIRY',
          customerName: inq.name || inq.customerName || 'Customer',
          email: inq.email || 'No email provided',
          phone: inq.phone || 'No phone provided',
          project: inq.projectName || (inq.projectId ? inq.projectId.name : 'General Inquiry'),
          plotNo: inq.plotNo || 'N/A',
          type: inq.inquiryType || 'CONTACT_FORM',
          message: inq.message || '',
          unitCount: '',
          budgetRange: '',
          city: '',
          assignedAgent: inq.assignedAgentId ? (inq.assignedAgentId.userId ? inq.assignedAgentId.userId.fullName : 'Assigned Agent') : 'Unassigned (Direct Desk)',
          status: inq.status || 'NEW',
          date: formatDate(inq.createdAt, { includeTime: true, fallback: 'Just now' }),
          createdAt: inq.createdAt || ''
        }))
        : []
      const bulkFormatted = Array.isArray(bulkData)
        ? bulkData.map((inq: any) => ({
          id: inq._id ? `BLK-${inq._id.slice(-6).toUpperCase()}` : 'BLK',
          rawId: inq._id,
          leadKind: 'BULK_BUY',
          customerName: inq.name || 'Customer',
          email: inq.email || 'No email provided',
          phone: inq.phone || 'No phone provided',
          project: inq.propertyTitle || inq.propertyId?.title || 'Bulk property buy',
          plotNo: inq.unitCount ? `${inq.unitCount} units` : 'Bulk',
          type: 'BULK_BUY',
          message: inq.message || '',
          unitCount: inq.unitCount || '',
          budgetRange: inq.budgetRange || '',
          city: inq.city || '',
          assignedAgent: inq.assignedAgentId ? (inq.assignedAgentId.userId ? inq.assignedAgentId.userId.fullName : 'Assigned Agent') : 'Unassigned (Direct Desk)',
          status: inq.status || 'NEW',
          date: formatDate(inq.createdAt, { includeTime: true, fallback: 'Just now' }),
          createdAt: inq.createdAt || ''
        }))
        : []
      const merged = [...formatted, ...bulkFormatted].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
      setInquiries(merged)
    } catch (e: any) {
      console.error('Inquiries load error', e)
      setError(e?.friendlyMessage || 'Failed to fetch customer inquiries.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (rawId: string, newStatus: string, leadKind?: string) => {
    try {
      if (leadKind === 'BULK_BUY') {
        await inquiriesService.updateBulkBuyStatus(rawId, { status: newStatus })
      } else {
        await inquiriesService.updateInquiryStatus(rawId, { status: newStatus })
      }
      if (selectedInquiry && selectedInquiry.rawId === rawId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus })
      }
      fetchInquiries()
    } catch (e: any) {
      console.error('Failed to update status', e)
    }
  }

  const filteredInquiries = inquiries.filter((inq) => {
    const matchesSearch =
      inq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inq.project.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || inq.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Reset to first page when search/filter changes
  React.useEffect(() => { setCurrentPage(1) }, [searchTerm, statusFilter])

  const paginatedInquiries = filteredInquiries.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const countNew = inquiries.filter(i => i.status === 'NEW').length;
  const countInProgress = inquiries.filter(i => i.status === 'IN_PROGRESS' || i.status === 'CONTACTED').length;
  const countConverted = inquiries.filter(i => i.status === 'CONVERTED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#171A18]">Customer Contact & Plot Inquiries</h1>
          <p className="text-xs text-[#171A18]/70 mt-1">Central CRM inbox for landing page contacts, site tours, price inquiries and bulk buy requests</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInquiries}
            className="p-2.5 text-[#0B4F3C] bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-xl hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <span className="px-3.5 py-2 bg-[#0B4F3C] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 border border-[#0B4F3C]">
            <MessageSquare className="w-4 h-4" /> {inquiries.length} Active Leads
          </span>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">New Unprocessed</p>
            <h3 className="text-2xl font-serif font-bold text-amber-700 mt-0.5">{countNew} Leads</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Awaiting agent callback</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">In Progress / Contacted</p>
            <h3 className="text-2xl font-serif font-bold text-sky-700 mt-0.5">{countInProgress} Leads</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Site visits & negotiations</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#0B4F3C] uppercase tracking-wider">Successfully Converted</p>
            <h3 className="text-2xl font-serif font-bold text-emerald-800 mt-0.5">{countConverted} Plot Sales</h3>
            <p className="text-[10px] text-[#171A18]/60 mt-0.5">Converted to plot bookings</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#171A18]/50" />
          <input
            type="text"
            placeholder="Search by customer name, email, or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0B4F3C]" />
          <span className="text-xs font-bold text-[#171A18]/70">Status:</span>
          {['ALL', 'NEW', 'IN_PROGRESS', 'CONVERTED'].map((st) => (
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
      </div>

      {/* Inquiries Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : error ? (
        <ErrorState title="Inquiries Load Failed" message={error} onRetry={fetchInquiries} />
      ) : filteredInquiries.length === 0 ? (
        <EmptyState
          title="No Customer Leads Found"
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No customer inquiries match your active filter criteria.'
              : 'No leads or inquiries have been received yet from the landing page.'
          }
          icon={Inbox}
        />
      ) : (
        <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#0B4F3C]/15 text-[#0B4F3C] font-bold uppercase text-[10px] bg-[#E8F0EC]">
                  <th className="py-3.5 px-4">Lead ID</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Target Land Plot</th>
                  <th className="py-3.5 px-4">Inquiry Type</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0B4F3C]/10">
                {paginatedInquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    onClick={() => setSelectedInquiry(inq)}
                    className="hover:bg-[#E8F0EC]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-[#0B4F3C]">{inq.id}</td>
                    <td className="py-4 px-4 space-y-0.5">
                      <h4 className="font-bold text-[#171A18] text-sm">{inq.customerName}</h4>
                      <p className="text-[11px] text-[#171A18]/70 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#0B4F3C]" /> {inq.email}
                      </p>
                      <p className="text-[11px] text-[#171A18]/70 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#0B4F3C]" /> {inq.phone}
                      </p>
                    </td>
                    <td className="py-4 px-4 space-y-0.5">
                      <span className="font-bold text-[#171A18] block">{inq.project}</span>
                      <span className="px-2 py-0.5 bg-[#E8F0EC] text-[#0B4F3C] text-[10px] font-bold rounded border border-[#0B4F3C]/20 inline-block">
                        Plot: {inq.plotNo}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded bg-[#FDFCF0] border border-[#0B4F3C]/20 font-bold text-[10px] text-[#0B4F3C]">
                        {inq.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-xs text-[#171A18]/80">{inq.assignedAgent}</td>
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={inq.status}
                        onChange={(e) => inq.rawId && handleStatusChange(inq.rawId, e.target.value, inq.leadKind)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer focus:outline-none ${
                          inq.status === 'NEW'
                            ? 'bg-amber-500/20 text-amber-800 border-amber-500/30'
                            : inq.status === 'IN_PROGRESS'
                            ? 'bg-sky-500/20 text-sky-800 border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="CONVERTED">CONVERTED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="px-3 py-1.5 bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors rounded-xl font-bold text-xs flex items-center gap-1.5 ml-auto cursor-pointer border border-[#0B4F3C]/20"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredInquiries.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            label="leads"
          />
        </div>
      )}

      {/* Customer Lead Modal View */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#0B4F3C]/20 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#0B4F3C]/15">
              <div>
                <span className="font-mono text-[10px] text-[#0B4F3C] font-bold uppercase">{selectedInquiry.id}</span>
                <h3 className="text-xl font-serif font-bold text-[#171A18]">{selectedInquiry.customerName}</h3>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-full text-[#171A18]/50 hover:bg-[#E8F0EC] hover:text-[#171A18] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Email Address</p>
                <p className="font-bold text-[#171A18] mt-0.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#0B4F3C]" /> {selectedInquiry.email}
                </p>
              </div>

              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Phone Number</p>
                <p className="font-bold text-[#171A18] mt-0.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#0B4F3C]" /> {selectedInquiry.phone}
                </p>
              </div>

              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Project Name</p>
                <p className="font-bold text-[#171A18] mt-0.5">{selectedInquiry.project}</p>
              </div>

              <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Plot / Unit</p>
                <p className="font-bold text-[#0B4F3C] mt-0.5">{selectedInquiry.type === 'BULK_BUY' ? selectedInquiry.plotNo : `Plot ${selectedInquiry.plotNo}`}</p>
              </div>
            </div>
            {selectedInquiry.type === 'BULK_BUY' && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                  <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Units</p>
                  <p className="font-bold text-[#171A18] mt-0.5">{selectedInquiry.unitCount || selectedInquiry.plotNo}</p>
                </div>
                <div className="bg-[#FDFCF0] p-3 rounded-2xl border border-[#0B4F3C]/15">
                  <p className="text-[10px] text-[#171A18]/60 font-semibold uppercase">Budget / City</p>
                  <p className="font-bold text-[#171A18] mt-0.5">{[selectedInquiry.budgetRange, selectedInquiry.city].filter(Boolean).join(' · ') || '—'}</p>
                </div>
              </div>
            )}

            {selectedInquiry.message && (
              <div className="bg-[#E8F0EC]/50 p-4 rounded-2xl border border-[#0B4F3C]/15 space-y-1">
                <p className="text-[10px] text-[#0B4F3C] font-bold uppercase">Customer Message / Special Requirements</p>
                <p className="text-xs text-[#171A18] leading-relaxed italic">{selectedInquiry.message}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#0B4F3C]/15 text-xs">
              <span className="text-[#171A18]/60 font-mono text-[11px]">Date: {selectedInquiry.date}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#171A18]">Update Status:</span>
                <select
                  value={selectedInquiry.status}
                  onChange={(e) => selectedInquiry.rawId && handleStatusChange(selectedInquiry.rawId, e.target.value, selectedInquiry.leadKind)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border border-[#0B4F3C]/30 bg-white cursor-pointer focus:outline-none"
                >
                  <option value="NEW">NEW</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="CONVERTED">CONVERTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default LeadsInquiriesPage

