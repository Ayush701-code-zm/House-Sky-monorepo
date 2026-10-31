import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, CheckCircle2, FileSignature, BadgeCheck, Circle } from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/dashboard/StatCard';
import { PageFrame, plotTone, rupee } from './agentUi';

export const PlotAvailabilityPage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState('');
  const [plots, setPlots] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(Array.isArray(res.data) ? res.data : [])).catch(() => setError('Could not load projects.'));
  }, []);

  useEffect(() => {
    if (!projectId) {
      setPlots([]);
      setSelected(null);
      return;
    }
    api.get('/plots', { params: { projectId } }).then((res) => setPlots(Array.isArray(res.data) ? res.data : [])).catch(() => setError('Could not load plots.'));
  }, [projectId]);

  const project = projects.find((item) => item._id === projectId);
  const counts = useMemo(() => {
    const bag = { total: plots.length, AVAILABLE: 0, BOOKED: 0, AGREEMENT: 0, SOLD: 0, PENDING: 0 };
    plots.forEach((plot) => {
      const key = plot.status as keyof typeof bag;
      if (bag[key] !== undefined) bag[key] += 1;
    });
    return bag;
  }, [plots]);

  const visible = plots
    .filter((plot) => !query.trim() || String(plot.plotNo).toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => String(a.plotNo).localeCompare(String(b.plotNo), undefined, { numeric: true }));

  return (
    <PageFrame title="Project plots" note="Pick a project, then open a row for size, PLC, and price.">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-[#171A18]/70">Project
          <select className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 font-bold text-[#171A18]" value={projectId} onChange={(e) => { setProjectId(e.target.value); setSelected(null); }}>
            <option value="">Choose a project</option>
            {projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[#171A18]/70">Find a plot
          <input className="w-full mt-1 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2.5 font-semibold" placeholder="Plot number" value={query} onChange={(e) => setQuery(e.target.value)} disabled={!projectId} />
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Plots" value={projectId ? counts.total : '—'} icon={MapPin} />
        <StatCard title="Open" value={projectId ? counts.AVAILABLE : '—'} icon={Circle} />
        <StatCard title="Held" value={projectId ? counts.BOOKED + counts.PENDING : '—'} icon={CheckCircle2} subtitle="Booked or waiting" />
        <StatCard title="Agreement" value={projectId ? counts.AGREEMENT : '—'} icon={FileSignature} />
        <StatCard title="Sold" value={projectId ? counts.SOLD : '—'} icon={BadgeCheck} />
      </div>

      {project && (project.paymentQrUrl || project.bankDetails) && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 md:flex md:items-start md:gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B4F3C]">Collection account</p>
            {project.bankDetails && <p className="text-sm mt-2 whitespace-pre-wrap text-[#171A18]">{project.bankDetails}</p>}
          </div>
          {project.paymentQrUrl && <img src={project.paymentQrUrl} alt="Payment QR" className="mt-3 md:mt-0 w-28 h-28 object-contain bg-[#FDFCF0] rounded-xl border border-[#0B4F3C]/10" />}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#FDFCF0] text-[10px] uppercase tracking-wider text-[#0B4F3C]">
              <tr>
                <th className="text-left px-4 py-2">Plot</th>
                <th className="text-left px-4 py-2">Block</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Area</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((plot) => (
                <tr key={plot._id} className={`border-t border-[#0B4F3C]/10 cursor-pointer ${selected?._id === plot._id ? 'bg-[#E8F0EC]' : 'hover:bg-[#FDFCF0]'}`} onClick={() => setSelected(plot)}>
                  <td className="px-4 py-2.5 font-bold">{plot.plotNo}</td>
                  <td className="px-4 py-2.5">{plot.block || '—'}</td>
                  <td className="px-4 py-2.5"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${plotTone(plot.status)}`}>{plot.status}</span></td>
                  <td className="px-4 py-2.5 text-right">{plot.sizeSqft || 0} sq ft</td>
                </tr>
              ))}
              {projectId && visible.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[#171A18]/60">No plots match.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="bg-amber-50 border border-amber-200 rounded-2xl p-5 h-fit">
          {selected ? (
            <div className="space-y-2 text-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#0B4F3C]">Plot {selected.plotNo}</p>
              <p className="font-serif text-2xl font-bold text-[#171A18]">{rupee(selected.totalCost || selected.price || 0)}</p>
              <p>Type {selected.plotType || '—'}</p>
              <p>Super built-up {selected.superBuiltUpSqft || 0} sq ft</p>
              <p>Built-up {selected.sizeSqft || 0} sq ft</p>
              <p>Dimensions {selected.dimensions || '—'}</p>
              <p>PLC {selected.totalPlc || 0}</p>
              <p>Registry {selected.registryStatus === 'REGISTERED' ? 'Done' : 'Not yet'}</p>
            </div>
          ) : (
            <p className="text-sm text-[#171A18]/60">Select a row to see that plot. You can book it from Start a booking on your desk.</p>
          )}
        </aside>
      </div>
    </PageFrame>
  );
};
