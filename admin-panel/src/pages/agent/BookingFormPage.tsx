import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { DraftNotice } from '../../components/common/DraftNotice';
import { clearDraft } from '../../utils/formDraft';
import { mergeDraft, usePersistDraft } from '../../utils/useFormDraft';
import { fieldClass, PageFrame, uploadImage } from './agentUi';

const DRAFT_KEY = 'hs-admin-booking-new';
const EMPTY = {
  projectId: '',
  plotId: '',
  floorNo: '',
  bookingAmount: '',
  bookingDate: new Date().toISOString().slice(0, 10),
  gender: 'Male',
  customerName: '',
  fatherOrHusbandName: '',
  presentAddress: '',
  city: '',
  pinCode: '',
  permanentAddress: '',
  dateOfBirth: '',
  age: '',
  mobile: '',
  phone: '',
  email: '',
  education: '',
  occupation: '',
  panNumber: '',
  idNumber: '',
  income: '',
  futurePlan: '',
  nomineeName: '',
  nomineeDob: '',
  nomineeAddress: '',
  nomineeRelation: '',
  nomineePan: '',
  nomineeAadhaar: '',
  depositPhotoUrl: '',
  passportPhotoUrl: '',
  addressProofUrl: '',
  idDocUrls: [] as string[],
  termsAccepted: false,
};

export const BookingFormPage: React.FC = () => {
  const boot = useMemo(() => mergeDraft(DRAFT_KEY, EMPTY), []);
  const [form, setForm] = useState(boot.value);
  const [restored, setRestored] = useState(boot.restored);
  const [projects, setProjects] = useState<any[]>([]);
  const [plots, setPlots] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const clear = usePersistDraft(DRAFT_KEY, form, EMPTY);

  useEffect(() => {
    api.get('/projects').then((res) => setProjects(Array.isArray(res.data) ? res.data : []));
  }, []);

  useEffect(() => {
    if (!form.projectId) {
      setPlots([]);
      return;
    }
    api.get('/plots', { params: { projectId: form.projectId } }).then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      setPlots(rows.filter((plot) => plot.status === 'AVAILABLE' || plot._id === form.plotId));
    });
  }, [form.projectId, form.plotId]);

  const plot = plots.find((item) => item._id === form.plotId);
  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const onFile = async (key: 'depositPhotoUrl' | 'passportPhotoUrl' | 'addressProofUrl' | 'idDoc', file?: File) => {
    if (!file) return;
    setError('');
    try {
      const url = await uploadImage(file);
      if (key === 'idDoc') setForm((prev) => ({ ...prev, idDocUrls: [...prev.idDocUrls, url].slice(0, 2) }));
      else set(key, url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.termsAccepted) {
      setError('Accept the booking terms before submitting.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/bookings', {
        ...form,
        plotType: plot?.plotType || '',
        superBuiltUpSqft: plot?.superBuiltUpSqft || 0,
        buildUpArea: plot?.sizeSqft || 0,
        dimensions: plot?.dimensions || '',
        bookingAmount: Number(form.bookingAmount) || 0,
      });
      clear();
      clearDraft(DRAFT_KEY);
      setForm(EMPTY);
      setRestored(false);
      setMessage(`Booking sent for verification. Reference ${res.data?._id || ''}. The company will confirm it after checking the deposit photo.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not submit the booking.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageFrame title="New booking" note="The plot details fill in after you choose the unit. The company confirms the booking after they see the deposit photo.">
      {restored && <DraftNotice onDiscard={() => { clear(); clearDraft(DRAFT_KEY); setForm(EMPTY); setRestored(false); }} />}
      <form onSubmit={submit} className="space-y-4">
        <section className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#0B4F3C]">Unit</h3>
        <label className="block text-xs font-semibold">Project
          <select className={fieldClass} value={form.projectId} onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value, plotId: '' }))}>
            <option value="">Select project</option>
            {projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold">Plot / flat
          <select className={fieldClass} value={form.plotId} onChange={(e) => set('plotId', e.target.value)}>
            <option value="">Select plot</option>
            {plots.map((item) => <option key={item._id} value={item._id}>{item.plotNo}{item.block ? ` · ${item.block}` : ''}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold">Floor no
          <input className={fieldClass} value={form.floorNo} onChange={(e) => set('floorNo', e.target.value)} />
        </label>
        <label className="block text-xs font-semibold">Flat / plot type
          <input className={fieldClass} readOnly value={plot?.plotType || ''} />
        </label>
        <label className="block text-xs font-semibold">Super built-up area (sq ft)
          <input className={fieldClass} readOnly value={plot?.superBuiltUpSqft || 0} />
        </label>
        <label className="block text-xs font-semibold">Built-up area
          <input className={fieldClass} readOnly value={plot?.sizeSqft || ''} />
        </label>
        <label className="block text-xs font-semibold">Dimensions
          <input className={fieldClass} readOnly value={plot?.dimensions || ''} />
        </label>
        </section>
        <section className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#0B4F3C]">Payment</h3>
        <label className="block text-xs font-semibold">Booking amount
          <input className={fieldClass} inputMode="numeric" value={form.bookingAmount} onChange={(e) => set('bookingAmount', e.target.value)} />
        </label>
        <FileRow label="Amount deposit photo" url={form.depositPhotoUrl} onFile={(file) => onFile('depositPhotoUrl', file)} />
        </section>
        <section className="bg-sky-50 border border-sky-300 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#0B4F3C]">Customer</h3>
        <label className="block text-xs font-semibold">Booking date
          <input type="date" className={fieldClass} value={form.bookingDate} onChange={(e) => set('bookingDate', e.target.value)} />
        </label>
        <div className="flex gap-4 text-sm font-semibold">
          <label><input type="radio" checked={form.gender === 'Male'} onChange={() => set('gender', 'Male')} /> Male</label>
          <label><input type="radio" checked={form.gender === 'Female'} onChange={() => set('gender', 'Female')} /> Female</label>
        </div>
        <FileRow label="Customer passport size image" url={form.passportPhotoUrl} onFile={(file) => onFile('passportPhotoUrl', file)} />
        <Text label="Customer full name" value={form.customerName} onChange={(v) => set('customerName', v)} required />
        <Text label="Father / husband name" value={form.fatherOrHusbandName} onChange={(v) => set('fatherOrHusbandName', v)} />
        <Text label="Present address" value={form.presentAddress} onChange={(v) => set('presentAddress', v)} />
        <Text label="City" value={form.city} onChange={(v) => set('city', v)} />
        <Text label="PIN code" value={form.pinCode} onChange={(v) => set('pinCode', v)} />
        <FileRow label="Address proof" url={form.addressProofUrl} onFile={(file) => onFile('addressProofUrl', file)} />
        <Text label="Permanent address" value={form.permanentAddress} onChange={(v) => set('permanentAddress', v)} />
        <label className="block text-xs font-semibold">Date of birth
          <input type="date" className={fieldClass} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </label>
        <Text label="Age" value={form.age} onChange={(v) => set('age', v)} />
        <Text label="Mobile number" value={form.mobile} onChange={(v) => set('mobile', v)} required />
        <Text label="Phone number" value={form.phone} onChange={(v) => set('phone', v)} />
        <Text label="Email" value={form.email} onChange={(v) => set('email', v)} />
        <Text label="Education" value={form.education} onChange={(v) => set('education', v)} />
        <Text label="Occupation" value={form.occupation} onChange={(v) => set('occupation', v)} />
        </section>
        <section className="bg-violet-50 border border-violet-300 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#0B4F3C]">Identity and nominee</h3>
        <Text label="PAN number" value={form.panNumber} onChange={(v) => set('panNumber', v)} />
        <Text label="Aadhaar, passport, or voter ID" value={form.idNumber} onChange={(v) => set('idNumber', v)} />
        <FileRow label="ID image" url={form.idDocUrls[0] || ''} onFile={(file) => onFile('idDoc', file)} />
        <Text label="Income" value={form.income} onChange={(v) => set('income', v)} />
        <Text label="Future plan" value={form.futurePlan} onChange={(v) => set('futurePlan', v)} />
        <Text label="Nominee name" value={form.nomineeName} onChange={(v) => set('nomineeName', v)} />
        <label className="block text-xs font-semibold">Nominee date of birth
          <input type="date" className={fieldClass} value={form.nomineeDob} onChange={(e) => set('nomineeDob', e.target.value)} />
        </label>
        <Text label="Nominee address" value={form.nomineeAddress} onChange={(v) => set('nomineeAddress', v)} />
        <Text label="Relation" value={form.nomineeRelation} onChange={(v) => set('nomineeRelation', v)} />
        <Text label="Nominee PAN" value={form.nomineePan} onChange={(v) => set('nomineePan', v)} />
        <Text label="Nominee Aadhaar" value={form.nomineeAadhaar} onChange={(v) => set('nomineeAadhaar', v)} />
        <label className="flex items-center gap-2 text-sm font-semibold pt-2">
          <input type="checkbox" checked={form.termsAccepted} onChange={(e) => set('termsAccepted', e.target.checked)} />
          I agree to the plot booking terms
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-[#0B4F3C]">{message}</p>}
        <button disabled={busy} className="w-full py-3 rounded-xl bg-[#0B4F3C] text-white font-bold disabled:opacity-50">
          {busy ? 'Sending…' : 'Send for company check'}
        </button>
        </section>
      </form>
    </PageFrame>
  );
};

function Text({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold">{label}
      <input required={required} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function FileRow({ label, url, onFile }: { label: string; url: string; onFile: (file?: File) => void }) {
  return (
    <label className="block text-xs font-semibold">{label}
      <p className="text-[11px] text-[#171A18]/60">Image size must be less than 2 MB</p>
      <input type="file" accept="image/*,application/pdf" className="mt-1 text-xs" onChange={(e) => onFile(e.target.files?.[0])} />
      {url && <p className="text-[11px] text-[#0B4F3C] truncate">Uploaded</p>}
    </label>
  );
}
