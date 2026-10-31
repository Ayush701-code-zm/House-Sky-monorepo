import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { rupee } from './agent/agentUi';

export const BookingsPage: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [group, setGroup] = useState<'agent' | 'project'>('agent');
  const [report, setReport] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [target, setTarget] = useState({ employeeId: '', yearlyTargetPlots: '', yearlyTargetAmount: '' });
  const [note, setNote] = useState('');

  const load = () => {
    api.get('/bookings', { params: { q: q || undefined, status: status || undefined } })
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []));
  };

  useEffect(() => {
    load();
    api.get('/employees').then((res) => setPeople(Array.isArray(res.data) ? res.data : []));
  }, []);

  const act = async (id: string, path: string) => {
    setNote('');
    try {
      await api.post(`/bookings/${id}/${path}`, {});
      setNote('Updated.');
      load();
    } catch (err: any) {
      setNote(err?.response?.data?.message || 'Could not update that booking.');
    }
  };

  const runReport = async () => {
    const res = await api.get('/bookings/reports', { params: { group } });
    setReport(Array.isArray(res.data) ? res.data : []);
  };

  const saveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put('/agent/yearly-target', {
      employeeId: target.employeeId,
      yearlyTargetPlots: Number(target.yearlyTargetPlots) || 0,
      yearlyTargetAmount: Number(target.yearlyTargetAmount) || 0,
    });
    setNote('Yearly target saved.');
  };

  return (
    <div className="space-y-6 pb-10">
      <h1 className="font-serif text-2xl font-bold">Bookings</h1>
      {note && <p className="text-sm text-[#0B4F3C]">{note}</p>}
      <div className="flex flex-wrap gap-2">
        <input className="border rounded-xl px-3 py-2" placeholder="Name, mobile, plot, or agent ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded-xl px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING_VERIFICATION">Pending verification</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCEL_REQUESTED">Cancel requested</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button type="button" className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold" onClick={load}>Search</button>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row._id} className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-4 space-y-2">
            <p className="font-bold">{row.customerName} · {row.mobile}</p>
            <p className="text-sm">{row.projectId?.name} · plot {row.plotId?.plotNo} · {row.plotId?.status} · {row.status}</p>
            <p className="text-sm">{rupee(row.bookingAmount)} · agent {row.agentEmployeeId?.employeeCode}</p>
            {row.depositPhotoUrl && <a className="text-sm text-[#0B4F3C] underline" href={row.depositPhotoUrl} target="_blank" rel="noreferrer">Deposit photo</a>}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {row.status === 'PENDING_VERIFICATION' && (
                <>
                  <button type="button" className="px-3 py-1 rounded-lg bg-[#0B4F3C] text-white" onClick={() => act(row._id, 'confirm')}>Confirm</button>
                  <button type="button" className="px-3 py-1 rounded-lg bg-red-700 text-white" onClick={() => act(row._id, 'reject')}>Reject</button>
                </>
              )}
              {row.status === 'CONFIRMED' && row.plotId?.status !== 'AGREEMENT' && row.plotId?.status !== 'SOLD' && (
                <button type="button" className="px-3 py-1 rounded-lg bg-violet-700 text-white" onClick={() => act(row._id, 'agreement')}>Mark agreement</button>
              )}
              {row.status === 'CONFIRMED' && row.plotId?.status !== 'SOLD' && (
                <button type="button" className="px-3 py-1 rounded-lg bg-red-600 text-white" onClick={() => act(row._id, 'sold')}>Mark sold</button>
              )}
              {row.status === 'CANCEL_REQUESTED' && (
                <button type="button" className="px-3 py-1 rounded-lg bg-[#171A18] text-white" onClick={() => act(row._id, 'accept-cancel')}>Accept cancellation</button>
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="bg-[#FDFCF0] border rounded-2xl p-4 space-y-3">
        <h2 className="font-bold">Sales report</h2>
        <div className="flex gap-2">
          <select className="border rounded-xl px-3 py-2" value={group} onChange={(e) => setGroup(e.target.value as 'agent' | 'project')}>
            <option value="agent">By agent</option>
            <option value="project">By project</option>
          </select>
          <button type="button" className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold" onClick={runReport}>Run</button>
        </div>
        <ul className="text-sm space-y-1">
          {report.map((row) => (
            <li key={String(row._id)}>{row.label || 'Unknown'} · {row.bookings} bookings · {rupee(row.amount)}</li>
          ))}
        </ul>
      </section>

      <form onSubmit={saveTarget} className="bg-white border rounded-2xl p-4 space-y-2">
        <h2 className="font-bold">Set an agent yearly target</h2>
        <select className="border rounded-xl px-3 py-2 w-full" value={target.employeeId} onChange={(e) => setTarget({ ...target, employeeId: e.target.value })}>
          <option value="">Select agent</option>
          {people.map((person) => (
            <option key={person.id || person._id} value={person.id || person._id}>
              {(person.userId?.fullName || person.employeeCode)} · {person.employeeCode}
            </option>
          ))}
        </select>
        <input className="border rounded-xl px-3 py-2 w-full" placeholder="Target plots" value={target.yearlyTargetPlots} onChange={(e) => setTarget({ ...target, yearlyTargetPlots: e.target.value })} />
        <input className="border rounded-xl px-3 py-2 w-full" placeholder="Target amount" value={target.yearlyTargetAmount} onChange={(e) => setTarget({ ...target, yearlyTargetAmount: e.target.value })} />
        <button className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold">Save target</button>
      </form>
    </div>
  );
};
