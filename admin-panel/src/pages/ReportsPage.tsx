import React, { useState } from 'react';
import { FileBarChart, Download, Loader2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const REPORTS = [
  { title: 'Revenue & Sales Report', type: 'REVENUE', endpoint: '/reports/revenue', desc: 'Every completed sale transaction with project, plot, buyer, seller & amount' },
  { title: 'Differential Commission Audit', type: 'COMMISSION', endpoint: '/reports/commission-audit', desc: 'Full upline differential commission calculation audit trail' },
  { title: 'MLM Downline Performance', type: 'MLM_HIERARCHY', endpoint: '/reports/mlm-performance', desc: 'Agent self sales, team sales, active legs, rank & sponsor' },
  { title: 'Plot Inventory Ledger', type: 'PLOT_SALES', endpoint: '/reports/plot-ledger', desc: 'Client 15-column format: Plot No, Sellable/Carpet SqYrd, PLC, GST, Cost, Status & Owner' },
  { title: 'Payout Disbursement Log', type: 'PAYOUT_SUMMARY', endpoint: '/reports/payout-summary', desc: 'Requested & approved payouts with settled commission counts' }
];

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const toast = useToast();

  const handleExportReport = async (endpoint: string, title: string) => {
    try {
      setLoading(endpoint);
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${title} exported`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.friendlyMessage || `Failed to export "${title}" (admin only).`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Financial & Audit Reports</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Exportable CSV financial audits, MLM tree reports, and plot inventory ledgers — generated from live data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REPORTS.map((report, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-[#0B4F3C]/15 hover:border-[#0B4F3C]/40 transition-all space-y-4 shadow-sm">
            <FileBarChart className="w-8 h-8 text-[#0B4F3C]" />
            <div>
              <h3 className="font-serif font-bold text-[#171A18] text-base">{report.title}</h3>
              <p className="text-xs text-[#171A18]/70 mt-1">{report.desc}</p>
            </div>
            <button
              onClick={() => handleExportReport(report.endpoint, report.title)}
              disabled={loading === report.endpoint}
              className="w-full py-2.5 bg-[#0B4F3C] hover:bg-[#063B2D] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#0B4F3C] disabled:opacity-60"
            >
              {loading === report.endpoint ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4 text-white" /> Export CSV</>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
