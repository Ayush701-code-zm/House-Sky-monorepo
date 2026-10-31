import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plot, Project, Employee } from '../types';
import { PlotMapCanvas } from '../components/plots/PlotMapCanvas';
import { PlotDetailModal } from '../components/plots/PlotDetailModal';
import { UploadNaksaModal } from '../components/plots/UploadNaksaModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Pagination } from '../components/common/Pagination';
import { formatCurrency, formatArea } from '../utils/formatters';
import { LayoutGrid, Table, Download, Upload, Search, RefreshCw, ScanText, MapPin } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const PlotManagementPage: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [viewMode, setViewMode] = useState<'MAP' | 'TABLE'>('MAP');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isNaksaModalOpen, setIsNaksaModalOpen] = useState<boolean>(false);

  const toast = useToast();

  useEffect(() => {
    fetchProjectsAndPlots();
  }, []);

  const fetchProjectsAndPlots = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projRes, plotRes, empRes] = await Promise.all([
        api.get('/projects'),
        api.get('/plots'),
        api.get('/employees')
      ]);

      setProjects(projRes.data || []);
      setPlots(plotRes.data || []);
      setEmployees(empRes.data || []);

      if (projRes.data?.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projRes.data[0]._id);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.friendlyMessage || 'Failed to fetch plot inventory data from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      // Export only the project currently being viewed (backend filters by projectId)
      const response = await api.get('/reports/plot-ledger', {
        params: selectedProjectId ? { projectId: selectedProjectId } : undefined,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Plot_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Plot Inventory Report CSV downloaded successfully.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.friendlyMessage || 'Failed to export Plot CSV report.');
    }
  };

  const handleImportCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedProjectId) {
      toast.error('Please select a project before importing plots.');
      return;
    }

    try {
      setIsImporting(true);

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error('CSV file appears empty or has no data rows.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim());
      const plotsData = lines.slice(1).map((line) => {
        const values: string[] = [];
        let inQuote = false;
        let cell = '';
        for (const ch of line) {
          if (ch === '"') { inQuote = !inQuote; }
          else if (ch === ',' && !inQuote) { values.push(cell.trim()); cell = ''; }
          else { cell += ch; }
        }
        values.push(cell.trim());

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });
        return row;
      }).filter((r) => r['Plot No'] || r['plotNo']);

      if (plotsData.length === 0) {
        toast.error('No valid plot rows found in CSV. Check header row matches expected format.');
        return;
      }

      const response = await api.post('/plots/import-csv', {
        projectId: selectedProjectId,
        plotsData
      });

      toast.success(`Successfully imported ${response.data.importedCount || 0} plots!`);
      fetchProjectsAndPlots();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.friendlyMessage || 'Failed to import CSV file. Please verify CSV format.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const filteredPlots = plots.filter((plot) => {
    const matchesProject = !selectedProjectId || (
      typeof plot.projectId === 'string'
        ? plot.projectId === selectedProjectId
        : plot.projectId?._id === selectedProjectId
    );
    const matchesStatus = statusFilter === 'ALL' || plot.status === statusFilter;
    const matchesSearch =
      (plot.plotNo && plot.plotNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (plot.ownerName && plot.ownerName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesProject && matchesStatus && matchesSearch;
  });

  // Pagination — resets to page 1 when filters change
  const [plotPage, setPlotPage] = useState(1);
  const [plotPageSize, setPlotPageSize] = useState(25);
  React.useEffect(() => { setPlotPage(1); }, [searchQuery, statusFilter, selectedProjectId, viewMode]);
  const paginatedPlots = filteredPlots.slice((plotPage - 1) * plotPageSize, plotPage * plotPageSize);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Land Plot Inventory & Map Layout</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Interactive Naksa map canvas & Client inventory ledgers</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-white p-1 rounded-xl border border-[#0B4F3C]/20 flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('MAP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'MAP'
                  ? 'bg-[#0B4F3C] text-white shadow-md'
                  : 'text-[#171A18]/70 hover:text-[#171A18]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Map View
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-[#0B4F3C] text-white shadow-md'
                  : 'text-[#171A18]/70 hover:text-[#171A18]'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Client Report Table
            </button>
          </div>

          {/* AI Naksa OCR Upload Action Button */}
          <button
            onClick={() => setIsNaksaModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#0B4F3C]"
          >
            <ScanText className="w-4 h-4 text-white" /> Upload Gov. Naksa (AI OCR)
          </button>

          {/* Export CSV & Import CSV Actions */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] font-bold text-xs hover:bg-[#0B4F3C] hover:text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0B4F3C]" /> Export Report CSV
          </button>

          {selectedProjectId && (
            <label className="px-3.5 py-2 rounded-xl bg-[#E8F0EC] hover:bg-[#0B4F3C] hover:text-white text-[#0B4F3C] font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer border border-[#0B4F3C]/20 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {isImporting ? 'Importing...' : 'Import Plots CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSVFile}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          )}

          <button
            onClick={fetchProjectsAndPlots}
            className="p-2 rounded-xl bg-[#E8F0EC] border border-[#0B4F3C]/20 text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Selector */}
          <div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-[#FDFCF0] border border-[#0B4F3C]/20 text-[#171A18] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-[#0B4F3C]"
            >
              <option value="">All Projects</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name} ({proj.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 p-1 rounded-xl">
            {['ALL', 'AVAILABLE', 'BOOKED', 'AGREEMENT', 'PENDING', 'SOLD'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#0B4F3C] text-white'
                    : 'text-[#171A18]/70 hover:text-[#171A18]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#0B4F3C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Plot No or Owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl text-xs text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] w-64"
          />
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        viewMode === 'MAP' ? (
          <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 h-96 flex items-center justify-center animate-pulse">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 border-4 border-[#0B4F3C] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-[#171A18]/60 font-bold">Rendering Vector Map Canvas...</p>
            </div>
          </div>
        ) : (
          <TableSkeleton rows={8} columns={8} />
        )
      ) : error ? (
        <ErrorState title="Inventory Fetch Error" message={error} onRetry={fetchProjectsAndPlots} />
      ) : viewMode === 'MAP' ? (
        <PlotMapCanvas
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(projId) => setSelectedProjectId(projId)}
          plots={plots}
          onSelectPlot={(plot) => setSelectedPlot(plot)}
          onOpenNaksaModal={() => setIsNaksaModalOpen(true)}
          onRefresh={fetchProjectsAndPlots}
        />
      ) : filteredPlots.length === 0 ? (
        <EmptyState
          title="No Plots Found"
          description={
            searchQuery || statusFilter !== 'ALL'
              ? 'No plots match your active filter criteria. Try clearing search query or changing plot status filter.'
              : 'No plots have been created for this project yet. Use "Upload Gov. Naksa" or "Import Plots CSV" to seed inventory.'
          }
          icon={MapPin}
          actionLabel={searchQuery || statusFilter !== 'ALL' ? 'Clear Filters' : 'Upload Naksa'}
          onAction={() => {
            if (searchQuery || statusFilter !== 'ALL') {
              setSearchQuery('');
              setStatusFilter('ALL');
            } else {
              setIsNaksaModalOpen(true);
            }
          }}
        />
      ) : (
        /* Client Report Format Table View */
        <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/15 space-y-4 shadow-sm">
          <div className="overflow-x-auto rounded-xl border border-[#0B4F3C]/15">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#E8F0EC] text-[#0B4F3C] uppercase text-[10px] font-bold border-b border-[#0B4F3C]/15">
                <tr>
                  <th className="p-3">S.No</th>
                  <th className="p-3 font-extrabold text-[#0B4F3C]">Plot No</th>
                  <th className="p-3">Sellable Area</th>
                  <th className="p-3">Carpet Area</th>
                  <th className="p-3">12M Road</th>
                  <th className="p-3">9M Road</th>
                  <th className="p-3">Corner PLC</th>
                  <th className="p-3">Park Facing</th>
                  <th className="p-3 font-bold text-[#0B4F3C]">Total PLC</th>
                  <th className="p-3 text-amber-700">Discounted PLC</th>
                  <th className="p-3">OTMC</th>
                  <th className="p-3">GST on Charges</th>
                  <th className="p-3 font-extrabold text-[#0B4F3C]">Total Cost</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Owner / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0B4F3C]/10">
                {paginatedPlots.map((p, idx) => {
                  const globalIdx = (plotPage - 1) * plotPageSize + idx;
                  const sellable = p.sellableSqYrd || (p.sizeSqft ? (p.sizeSqft / 9).toFixed(2) : null);
                  const carpet = p.carpetSqYrd || (p.sizeSqft ? (p.sizeSqft / 18).toFixed(2) : null);
                  const totalCost = p.totalCost || p.price || 0;

                  return (
                    <tr
                      key={p._id}
                      onClick={() => setSelectedPlot(p)}
                      className="hover:bg-[#E8F0EC]/40 cursor-pointer transition-colors text-[#171A18] font-mono text-[11px]"
                    >
                    <td className="p-3 text-[#171A18]/70">{globalIdx + 1}</td>
                      <td className="p-3 font-bold text-[#0B4F3C]">{p.plotNo}</td>
                      <td className="p-3">{sellable ? `${sellable} Sq Yrd` : '—'}</td>
                      <td className="p-3">{carpet ? `${carpet} Sq Yrd` : '—'}</td>
                      <td className="p-3 text-center">{p.plc12mtr ? formatCurrency(p.plc12mtr, { allowZero: true }) : '-'}</td>
                      <td className="p-3 text-center">{p.plc9mtr ? formatCurrency(p.plc9mtr, { allowZero: true }) : '-'}</td>
                      <td className="p-3 text-center">{p.plcCorner ? 'Yes' : '-'}</td>
                      <td className="p-3 text-center">{p.plcParkFacing ? 'Yes' : '-'}</td>
                      <td className="p-3 font-bold text-[#0B4F3C]">{formatCurrency(p.totalPlc, { allowZero: true })}</td>
                      <td className="p-3 text-amber-700 font-bold">{formatCurrency(p.discountedPlc, { allowZero: true })}</td>
                      <td className="p-3">{formatCurrency(p.otmc, { allowZero: true })}</td>
                      <td className="p-3">{formatCurrency(p.gstOnOtherCharges, { allowZero: true })}</td>
                      <td className="p-3 font-extrabold text-[#0B4F3C]">
                        {formatCurrency(totalCost)}
                      </td>
                      <td className="p-3 font-sans">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          p.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/30' :
                          p.status === 'BOOKED' ? 'bg-sky-500/20 text-sky-800 border-sky-500/30' :
                          p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-800 border-amber-500/30' :
                          'bg-red-500/20 text-red-800 border-red-800/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#171A18]/70 font-sans">{p.ownerName || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={filteredPlots.length}
            currentPage={plotPage}
            pageSize={plotPageSize}
            onPageChange={setPlotPage}
            onPageSizeChange={(s) => { setPlotPageSize(s); setPlotPage(1); }}
            pageSizeOptions={[10, 25, 50, 100]}
            label="plots"
          />
        </div>
      )}

      {/* Plot Detail Modal */}
      {selectedPlot && (
        <PlotDetailModal
          plot={selectedPlot}
          employees={employees}
          onClose={() => setSelectedPlot(null)}
          onSuccess={fetchProjectsAndPlots}
        />
      )}

      {/* Upload Government Naksa AI OCR Modal */}
      {isNaksaModalOpen && (
        <UploadNaksaModal
          projects={projects}
          selectedProjectId={selectedProjectId}
          onClose={() => setIsNaksaModalOpen(false)}
          onSuccess={fetchProjectsAndPlots}
        />
      )}
    </div>
  );
};
