import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { fieldClass, PageFrame, personName, rupee, uploadImage } from './agentUi';

function useEmployees() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api.get('/employees').then((res) => setRows(Array.isArray(res.data) ? res.data : []));
  }, []);
  return rows;
}

function useBookings() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');
  const reload = () => {
    api.get('/bookings').then((res) => setRows(Array.isArray(res.data) ? res.data : [])).catch((err) => {
      setError(err?.response?.data?.message || 'Could not load bookings.');
    });
  };
  useEffect(() => { reload(); }, []);
  return { rows, error, reload };
}

export const TeamSalesPage: React.FC<{ title?: string }> = ({ title = 'Plots sold by team' }) => {
  const people = useEmployees();
  const [employeeId, setEmployeeId] = useState('');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<'summary' | 'detail'>('summary');
  const [result, setResult] = useState<any>(null);

  const show = async () => {
    const res = await api.get('/agent/team-sales', { params: { employeeId: employeeId || undefined, from, to } });
    setResult(res.data);
  };

  return (
    <PageFrame title={title}>
      <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-4 space-y-3">
        <select className={fieldClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
          <option value="">Select executive</option>
          {people.map((person) => <option key={person.id || person._id} value={person.id || person._id}>{personName(person)} · {person.employeeCode}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className={fieldClass} value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className={fieldClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex gap-4 text-sm">
          <label><input type="radio" checked={mode === 'summary'} onChange={() => setMode('summary')} /> Summary</label>
          <label><input type="radio" checked={mode === 'detail'} onChange={() => setMode('detail')} /> Detail</label>
        </div>
        <button type="button" onClick={show} className="px-5 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold">Show</button>
        {result && <p className="font-bold">Total plots: {result.totalPlots} · {rupee(result.totalAmount)}</p>}
        {result && mode === 'detail' && (
          <ul className="text-sm space-y-2">
            {(result.bookings || []).map((row: any) => (
              <li key={row._id} className="border-b border-[#0B4F3C]/10 pb-2">
                {row.customerName} · plot {row.plotId?.plotNo || '—'} · {rupee(row.bookingAmount)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageFrame>
  );
};

export const CollectionPage: React.FC = () => <TeamSalesPage title="Collection from team" />;

export const YearlyPlanPage: React.FC = () => {
  const [plan, setPlan] = useState<any>(null);
  useEffect(() => { api.get('/agent/yearly-plan').then((res) => setPlan(res.data)); }, []);
  return (
    <PageFrame title="Yearly plan">
      <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-5 space-y-2">
        <p>Year {plan?.year}</p>
        <p className="font-bold">Target plots: {plan?.targetPlots ?? 0}</p>
        <p className="font-bold">Bookings this year: {plan?.achievedPlots ?? 0}</p>
        <p>Target amount: {rupee(plan?.targetAmount || 0)}</p>
        <p>Booked amount: {rupee(plan?.achievedAmount || 0)}</p>
        <p className="text-xs text-[#171A18]/60">An admin sets the target. Your confirmed bookings count toward it.</p>
      </div>
    </PageFrame>
  );
};

export const MyCommissionPage: React.FC = () => {
  const { employee } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api.get('/commissions', { params: { employeeId: employee?.id } }).then((res) => setRows(Array.isArray(res.data) ? res.data : []));
  }, [employee?.id]);
  const total = rows.reduce((sum, row) => sum + (Number(row.commissionAmount) || 0), 0);
  return (
    <PageFrame title="Commission">
      <p className="font-bold">Your entries: {rupee(total)}</p>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row._id} className="bg-white border border-[#0B4F3C]/15 rounded-xl p-3 text-sm">
            {rupee(row.commissionAmount)} · {row.status} · plot {row.plotId?.plotNo || '—'}
          </li>
        ))}
        {rows.length === 0 && <li className="text-sm text-[#171A18]/60">No commission entries yet. They appear after a plot is marked sold.</li>}
      </ul>
    </PageFrame>
  );
};

export const MembersPage: React.FC = () => {
  const { employee } = useAuth();
  const people = useEmployees().filter((person) => (person.id || person._id) !== employee?.id);
  return (
    <PageFrame title="My members">
      <ul className="space-y-2">
        {people.map((person) => (
          <li key={person.id || person._id} className="bg-white border border-[#0B4F3C]/15 rounded-xl p-3">
            <p className="font-bold">{personName(person)}</p>
            <p className="text-sm">{person.employeeCode} · {person.currentRank}</p>
          </li>
        ))}
        {people.length === 0 && <li className="text-sm">No executives under you yet. Add one from the home menu.</li>}
      </ul>
    </PageFrame>
  );
};

export const EstimatePage: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState('');
  const [plots, setPlots] = useState<any[]>([]);
  const [plotId, setPlotId] = useState('');
  useEffect(() => { api.get('/projects').then((res) => setProjects(Array.isArray(res.data) ? res.data : [])); }, []);
  useEffect(() => {
    if (!projectId) return;
    api.get('/plots', { params: { projectId } }).then((res) => setPlots(Array.isArray(res.data) ? res.data : []));
  }, [projectId]);
  const plot = plots.find((item) => item._id === plotId);
  return (
    <PageFrame title="Estimate">
      <select className={fieldClass} value={projectId} onChange={(e) => { setProjectId(e.target.value); setPlotId(''); }}>
        <option value="">Select project</option>
        {projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
      </select>
      <select className={fieldClass} value={plotId} onChange={(e) => setPlotId(e.target.value)}>
        <option value="">Select plot</option>
        {plots.map((item) => <option key={item._id} value={item._id}>{item.plotNo}</option>)}
      </select>
      {plot && (
        <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-4 space-y-1 text-sm">
          <p>Type: {plot.plotType || '—'}</p>
          <p>Area: {plot.sizeSqft || 0} sq ft</p>
          <p>Super built-up: {plot.superBuiltUpSqft || 0} sq ft</p>
          <p className="font-bold text-lg">Price: {rupee(plot.totalCost || plot.price || 0)}</p>
        </div>
      )}
    </PageFrame>
  );
};

export const ReceiptPage: React.FC = () => {
  const { rows, error } = useBookings();
  const [current, setCurrent] = useState<any>(null);
  return (
    <PageFrame title="Customer receipt">
      {error && <p className="text-sm text-red-700">{error}</p>}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row._id}>
            <button type="button" className="w-full text-left bg-white border border-[#0B4F3C]/15 rounded-xl p-3" onClick={() => setCurrent(row)}>
              <span className="font-bold">{row.customerName}</span>
              <span className="text-sm"> · plot {row.plotId?.plotNo || '—'} · {row.status}</span>
            </button>
          </li>
        ))}
      </ul>
      {current && (
        <article className="bg-white border border-[#0B4F3C]/20 rounded-2xl p-5 space-y-1 print:border-0" id="receipt">
          <h2 className="font-serif text-xl font-bold">House & Sky booking receipt</h2>
          <p>{current.customerName} · {current.mobile}</p>
          <p>Project: {current.projectId?.name}</p>
          <p>Plot: {current.plotId?.plotNo}</p>
          <p>Amount: {rupee(current.bookingAmount)}</p>
          <p>Status: {current.status}</p>
          <p>Agent: {personName(current.agentEmployeeId)} · {current.agentEmployeeId?.employeeCode}</p>
          <button type="button" className="mt-3 px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold print:hidden" onClick={() => window.print()}>Print / save</button>
        </article>
      )}
    </PageFrame>
  );
};

export const CancelPlotPage: React.FC = () => {
  const { rows, error, reload } = useBookings();
  const [note, setNote] = useState('');
  const cancel = async (id: string) => {
    const reason = window.prompt('Reason for cancellation');
    if (reason === null) return;
    try {
      await api.post(`/bookings/${id}/cancel`, { reason });
      setNote('Cancellation sent.');
      reload();
    } catch (err: any) {
      setNote(err?.response?.data?.message || 'Could not cancel that booking.');
    }
  };
  const open = rows.filter((row) => ['PENDING_VERIFICATION', 'CONFIRMED', 'CANCEL_REQUESTED'].includes(row.status));
  return (
    <PageFrame title="Cancel plot / flat">
      {error && <p className="text-sm text-red-700">{error}</p>}
      {note && <p className="text-sm text-[#0B4F3C]">{note}</p>}
      <ul className="space-y-2">
        {open.map((row) => (
          <li key={row._id} className="bg-white border border-[#0B4F3C]/15 rounded-xl p-3 flex items-center justify-between gap-3">
            <span className="text-sm">{row.customerName} · plot {row.plotId?.plotNo} · {row.status}</span>
            {row.status !== 'CANCEL_REQUESTED' && (
              <button type="button" className="text-xs font-bold text-red-700" onClick={() => cancel(row._id)}>Cancel</button>
            )}
          </li>
        ))}
        {open.length === 0 && <li className="text-sm">No booking of yours can be cancelled right now.</li>}
      </ul>
    </PageFrame>
  );
};

export const CustomerDocsPage: React.FC = () => {
  const { rows, reload } = useBookings();
  const [bookingId, setBookingId] = useState('');
  const [title, setTitle] = useState('Customer document');
  const [note, setNote] = useState('');
  const send = async (file?: File) => {
    if (!file || !bookingId) return;
    const url = await uploadImage(file);
    await api.post(`/bookings/${bookingId}/documents`, { title, url });
    setNote('Document attached.');
    reload();
  };
  return (
    <PageFrame title="Upload customer document">
      <select className={fieldClass} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
        <option value="">Select booking</option>
        {rows.map((row) => <option key={row._id} value={row._id}>{row.customerName} · {row.plotId?.plotNo}</option>)}
      </select>
      <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="file" accept="image/*,application/pdf" onChange={(e) => send(e.target.files?.[0])} />
      {note && <p className="text-sm text-[#0B4F3C]">{note}</p>}
    </PageFrame>
  );
};

export const SearchExecutivePage: React.FC = () => {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.get('/employees', { params: { search: q } });
    setRows(Array.isArray(res.data) ? res.data : []);
  };
  return (
    <PageFrame title="Search executive">
      <form onSubmit={search} className="flex gap-2">
        <input className={fieldClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or member ID" />
        <button className="px-4 rounded-xl bg-[#0B4F3C] text-white font-bold">Search</button>
      </form>
      <ul className="space-y-2">
        {rows.map((person) => (
          <li key={person.id || person._id} className="bg-white border rounded-xl p-3">
            {personName(person)} · {person.employeeCode} · {person.currentRank}
          </li>
        ))}
      </ul>
    </PageFrame>
  );
};

export const ProfilePage: React.FC = () => {
  const [home, setHome] = useState<any>(null);
  const [note, setNote] = useState('');
  useEffect(() => { api.get('/agent/home').then((res) => setHome(res.data)); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put('/agent/profile', { fullName: home.fullName, phone: home.phone });
    setNote('Profile saved.');
  };
  if (!home) return <PageFrame title="My profile"><p>Loading…</p></PageFrame>;
  return (
    <PageFrame title="My profile">
      <form onSubmit={save} className="space-y-3 bg-white border rounded-2xl p-4">
        <p className="font-bold">{home.employeeCode} · {home.currentRank}</p>
        <input className={fieldClass} value={home.fullName} onChange={(e) => setHome({ ...home, fullName: e.target.value })} />
        <input className={fieldClass} value={home.phone} onChange={(e) => setHome({ ...home, phone: e.target.value })} />
        <p className="text-sm">{home.email}</p>
        <button className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold">Save</button>
        {note && <p className="text-sm text-[#0B4F3C]">{note}</p>}
      </form>
    </PageFrame>
  );
};

export const BankPage: React.FC = () => {
  const [bank, setBank] = useState<any>(null);
  const [note, setNote] = useState('');
  useEffect(() => { api.get('/agent/home').then((res) => setBank(res.data)); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put('/agent/bank', bank);
    setNote('Bank details saved.');
  };
  if (!bank) return <PageFrame title="My bank info"><p>Loading…</p></PageFrame>;
  return (
    <PageFrame title="My bank info">
      <form onSubmit={save} className="space-y-3">
        <input className={fieldClass} placeholder="Bank name" value={bank.bankName || ''} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} />
        <input className={fieldClass} placeholder="Account name" value={bank.bankAccountName || ''} onChange={(e) => setBank({ ...bank, bankAccountName: e.target.value })} />
        <input className={fieldClass} placeholder="Account number" value={bank.bankAccountNumber || ''} onChange={(e) => setBank({ ...bank, bankAccountNumber: e.target.value })} />
        <input className={fieldClass} placeholder="IFSC" value={bank.bankIfsc || ''} onChange={(e) => setBank({ ...bank, bankIfsc: e.target.value })} />
        <button className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold">Save</button>
        {note && <p className="text-sm text-[#0B4F3C]">{note}</p>}
      </form>
    </PageFrame>
  );
};

export const IdCardPage: React.FC = () => {
  const [home, setHome] = useState<any>(null);
  useEffect(() => { api.get('/agent/home').then((res) => setHome(res.data)); }, []);
  return (
    <PageFrame title="ID card">
      <div className="max-w-sm bg-[#0B4F3C] text-white rounded-3xl p-6 space-y-2">
        <p className="text-xs uppercase tracking-wider">House & Sky</p>
        <p className="font-serif text-2xl font-bold">{home?.fullName}</p>
        <p>{home?.employeeCode}</p>
        <p className="text-sm text-white/80">{home?.currentRank}</p>
        <p className="text-sm">{home?.phone}</p>
      </div>
      <button type="button" className="px-4 py-2 rounded-xl bg-[#171A18] text-white font-bold" onClick={() => window.print()}>Print</button>
    </PageFrame>
  );
};

export const PasswordPage: React.FC = () => {
  const [open, setOpen] = useState(true);
  return (
    <PageFrame title="Reset password">
      <p className="text-sm">Choose a new password for this agent login. The old one stops working on other devices.</p>
      <button type="button" className="px-4 py-2 rounded-xl bg-[#0B4F3C] text-white font-bold" onClick={() => setOpen(true)}>Change password</button>
      {open && <ChangePasswordModal onClose={() => setOpen(false)} />}
    </PageFrame>
  );
};
