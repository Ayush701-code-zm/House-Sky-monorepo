import React, { useEffect, useState } from 'react';
import { Save, ShieldCheck, Upload, FileText } from 'lucide-react';
import api from '../services/api';
import { AgentKyc, KycStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DraftNotice } from '../components/common/DraftNotice';
import { readDraft } from '../utils/formDraft';
import { usePersistDraft } from '../utils/useFormDraft';

const KYC_UPLOAD_FOLDER = 'agent_kyc';
const STATUS_DRAFT: KycStatus = 'DRAFT';
const STATUS_SUBMITTED: KycStatus = 'SUBMITTED';
const STATUS_APPROVED: KycStatus = 'APPROVED';
const STATUS_REJECTED: KycStatus = 'REJECTED';

const EMPTY_KYC: AgentKyc = {
  firstName: '',
  middleName: '',
  surname: '',
  dateOfBirth: '',
  address: '',
  mobile: '',
  alternatePhone: '',
  email: '',
  panNumber: '',
  aadhaarNumber: '',
  accountHolderName: '',
  accountNumber: '',
  ifscCode: '',
  bankName: '',
  branchName: '',
  nomineeName: '',
  nomineeDob: '',
  nomineeAddress: '',
  nomineeRelation: '',
  panDocUrl: '',
  panDocS3Key: '',
  aadhaarDocUrl: '',
  aadhaarDocS3Key: '',
  status: STATUS_DRAFT,
  rejectionReason: ''
};

const INPUT_CLASS =
  'w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-sm text-[#171A18] font-semibold focus:outline-none focus:border-[#0B4F3C] disabled:opacity-70';

function toDateInput(value?: string | null): string {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function statusCopy(status: KycStatus): { title: string; body: string; className: string } {
  if (status === STATUS_APPROVED) {
    return {
      title: 'KYC approved',
      body: 'A manager or admin has approved your KYC. You can request commission payouts.',
      className: 'bg-emerald-50 border-emerald-200 text-emerald-900'
    };
  }
  if (status === STATUS_SUBMITTED) {
    return {
      title: 'KYC submitted',
      body: 'Waiting for manager or admin approval. You cannot request a payout until this is approved.',
      className: 'bg-amber-50 border-amber-200 text-amber-900'
    };
  }
  if (status === STATUS_REJECTED) {
    return {
      title: 'KYC sent back',
      body: 'Correct the details below and submit again.',
      className: 'bg-red-50 border-red-200 text-red-900'
    };
  }
  return {
    title: 'Complete your KYC',
    body: 'Fill identity, bank, PAN and Aadhaar details. Payouts stay locked until a manager or admin approves this form.',
    className: 'bg-[#E8F0EC] border-[#0B4F3C]/20 text-[#0B4F3C]'
  };
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="text-[11px] font-bold text-[#171A18]/70 uppercase tracking-wide">
      {label}
      {required ? <span className="text-red-600"> *</span> : null}
    </label>
    {children}
  </div>
);

export const AgentKycPage: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const draftKey = `hs-admin-kyc-${user?.id || 'me'}`;
  const [form, setForm] = useState<AgentKyc>(EMPTY_KYC);
  const [serverForm, setServerForm] = useState<AgentKyc | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [employeeCode, setEmployeeCode] = useState('');
  const [joiningUnder, setJoiningUnder] = useState({ employeeCode: '', name: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string>('');
  const clearKycDraft = usePersistDraft(draftKey, form, serverForm, !isLoading && canEdit && serverForm != null);

  const setField = (key: keyof AgentKyc, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadKyc = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/kyc/me');
      const kyc = res.data?.kyc || {};
      const editable = Boolean(res.data?.canEdit);
      const server: AgentKyc = {
        ...EMPTY_KYC,
        ...kyc,
        dateOfBirth: toDateInput(kyc.dateOfBirth),
        nomineeDob: toDateInput(kyc.nomineeDob)
      };
      const saved = editable ? readDraft<AgentKyc>(draftKey) : null;
      const next = saved
        ? { ...server, ...saved, status: server.status, rejectionReason: server.rejectionReason }
        : server;
      setForm(next);
      setServerForm(server);
      setDraftRestored(Boolean(saved && JSON.stringify(next) !== JSON.stringify(server)));
      setCanEdit(editable);
      setEmployeeCode(res.data?.employee?.employeeCode || '');
      setJoiningUnder(res.data?.joiningUnder || { employeeCode: '', name: '' });
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Failed to load KYC');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadDoc = async (file: File, urlField: 'panDocUrl' | 'aadhaarDocUrl', keyField: 'panDocS3Key' | 'aadhaarDocS3Key') => {
    setUploadingField(urlField);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', KYC_UPLOAD_FOLDER);
      const response = await api.post('/upload', formData);
      setForm((prev) => ({
        ...prev,
        [urlField]: response.data?.url || '',
        [keyField]: response.data?.s3Key || ''
      }));
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Upload failed');
    } finally {
      setUploadingField('');
    }
  };

  const saveKyc = async (submit: boolean) => {
    setIsSaving(true);
    try {
      const res = await api.put('/kyc/me', { ...form, submit });
      const kyc = res.data?.kyc || {};
      setForm({
        ...EMPTY_KYC,
        ...kyc,
        dateOfBirth: toDateInput(kyc.dateOfBirth),
        nomineeDob: toDateInput(kyc.nomineeDob)
      });
      setCanEdit(Boolean(res.data?.canEdit));
      clearKycDraft();
      setServerForm({
        ...EMPTY_KYC,
        ...kyc,
        dateOfBirth: toDateInput(kyc.dateOfBirth),
        nomineeDob: toDateInput(kyc.nomineeDob)
      });
      setDraftRestored(false);
      toast.success(submit ? 'KYC submitted for manager/admin approval' : 'KYC draft saved');
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Failed to save KYC');
    } finally {
      setIsSaving(false);
    }
  };

  const banner = statusCopy(form.status || STATUS_DRAFT);

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <div className="w-8 h-8 border-4 border-[#0B4F3C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200 pb-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F0EC] text-[#0B4F3C] text-[10px] font-extrabold uppercase tracking-widest">
          <ShieldCheck className="w-3.5 h-3.5" /> Agent KYC
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#171A18] mt-2">Add Executive Details</h2>
        <p className="text-xs text-[#171A18]/60 mt-1">
          {user?.fullName || 'Agent'} {employeeCode ? `· ${employeeCode}` : ''}
        </p>
      </div>

      <div className={`rounded-2xl border px-4 py-3 text-xs ${banner.className}`}>
        <p className="font-bold">{banner.title}</p>
        <p className="mt-0.5 opacity-80">{banner.body}</p>
        {form.status === STATUS_REJECTED && form.rejectionReason ? (
          <p className="mt-1 font-semibold">Reason: {form.rejectionReason}</p>
        ) : null}
      </div>

      {draftRestored && serverForm && (
        <DraftNotice onDiscard={() => {
          clearKycDraft();
          setForm(serverForm);
          setDraftRestored(false);
        }} />
      )}

      <form
        className="bg-white rounded-3xl border border-[#0B4F3C]/15 shadow-sm p-5 sm:p-7 space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          saveKyc(true);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Executive First Name" required>
            <input className={INPUT_CLASS} disabled={!canEdit} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} />
          </Field>
          <Field label="Middle Name">
            <input className={INPUT_CLASS} disabled={!canEdit} value={form.middleName} onChange={(e) => setField('middleName', e.target.value)} />
          </Field>
          <Field label="Surname Name" required>
            <input className={INPUT_CLASS} disabled={!canEdit} value={form.surname} onChange={(e) => setField('surname', e.target.value)} />
          </Field>
        </div>

        <Field label="Date of Birth" required>
          <input type="date" className={INPUT_CLASS} disabled={!canEdit} value={form.dateOfBirth || ''} onChange={(e) => setField('dateOfBirth', e.target.value)} />
        </Field>

        <Field label="Address" required>
          <textarea className={`${INPUT_CLASS} min-h-[72px]`} disabled={!canEdit} value={form.address} onChange={(e) => setField('address', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Mobile No" required>
            <input className={INPUT_CLASS} disabled={!canEdit} value={form.mobile} onChange={(e) => setField('mobile', e.target.value)} maxLength={10} />
          </Field>
          <Field label="Alternate No.">
            <input className={INPUT_CLASS} disabled={!canEdit} value={form.alternatePhone} onChange={(e) => setField('alternatePhone', e.target.value)} maxLength={10} />
          </Field>
        </div>

        <Field label="Email Id">
          <input type="email" className={INPUT_CLASS} disabled={!canEdit} value={form.email} onChange={(e) => setField('email', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Enter Join Under ID">
            <input className={INPUT_CLASS} disabled value={joiningUnder.employeeCode || 'Root / Company'} />
          </Field>
          <Field label="Joining Under">
            <input className={INPUT_CLASS} disabled value={joiningUnder.name || 'Root / Company'} />
          </Field>
        </div>

        <div className="pt-2 border-t border-[#0B4F3C]/10">
          <p className="text-[11px] font-extrabold text-[#0B4F3C] uppercase tracking-wider mb-3">Identity documents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="PAN Number" required>
              <input className={`${INPUT_CLASS} uppercase`} disabled={!canEdit} value={form.panNumber} onChange={(e) => setField('panNumber', e.target.value.toUpperCase())} maxLength={10} />
            </Field>
            <Field label="Aadhaar Number" required>
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.aadhaarNumber} onChange={(e) => setField('aadhaarNumber', e.target.value.replace(/\D/g, ''))} maxLength={12} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <DocUpload
              label="PAN Card photo / PDF"
              url={form.panDocUrl}
              uploading={uploadingField === 'panDocUrl'}
              disabled={!canEdit}
              onFile={(file) => uploadDoc(file, 'panDocUrl', 'panDocS3Key')}
            />
            <DocUpload
              label="Aadhaar photo / PDF"
              url={form.aadhaarDocUrl}
              uploading={uploadingField === 'aadhaarDocUrl'}
              disabled={!canEdit}
              onFile={(file) => uploadDoc(file, 'aadhaarDocUrl', 'aadhaarDocS3Key')}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#0B4F3C]/10">
          <p className="text-[11px] font-extrabold text-[#0B4F3C] uppercase tracking-wider mb-3">Bank account for payouts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Account Holder Name" required>
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.accountHolderName} onChange={(e) => setField('accountHolderName', e.target.value)} />
            </Field>
            <Field label="Bank Name" required>
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.bankName} onChange={(e) => setField('bankName', e.target.value)} />
            </Field>
            <Field label="Account Number" required>
              <input className={`${INPUT_CLASS} font-mono`} disabled={!canEdit} value={form.accountNumber} onChange={(e) => setField('accountNumber', e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="IFSC Code" required>
              <input className={`${INPUT_CLASS} uppercase font-mono`} disabled={!canEdit} value={form.ifscCode} onChange={(e) => setField('ifscCode', e.target.value.toUpperCase())} maxLength={11} />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Branch Name" required>
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.branchName} onChange={(e) => setField('branchName', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="pt-2 border-t border-[#0B4F3C]/10">
          <p className="text-[11px] font-extrabold text-[#0B4F3C] uppercase tracking-wider mb-3">Nominee (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nominee">
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.nomineeName} onChange={(e) => setField('nomineeName', e.target.value)} />
            </Field>
            <Field label="Nominee Date of Birth">
              <input type="date" className={INPUT_CLASS} disabled={!canEdit} value={form.nomineeDob || ''} onChange={(e) => setField('nomineeDob', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Field label="Nominee Address">
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.nomineeAddress} onChange={(e) => setField('nomineeAddress', e.target.value)} />
            </Field>
            <Field label="Relation">
              <input className={INPUT_CLASS} disabled={!canEdit} value={form.nomineeRelation} onChange={(e) => setField('nomineeRelation', e.target.value)} />
            </Field>
          </div>
        </div>

        {canEdit ? (
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => saveKyc(false)}
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl border border-[#0B4F3C]/20 bg-[#E8F0EC] text-[#0B4F3C] text-xs font-bold disabled:opacity-60"
            >
              Save draft
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving…' : 'Submit for approval'}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
};

interface DocUploadProps {
  label: string;
  url: string;
  uploading: boolean;
  disabled: boolean;
  onFile: (file: File) => void;
}

const DocUpload: React.FC<DocUploadProps> = ({ label, url, uploading, disabled, onFile }) => (
  <div className="rounded-2xl border border-dashed border-[#0B4F3C]/30 bg-[#FDFCF0] p-3">
    <p className="text-[11px] font-bold text-[#171A18]/70">{label} <span className="text-red-600">*</span></p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="mt-1 text-[11px] text-[#0B4F3C] font-bold underline break-all inline-flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" /> View uploaded file
      </a>
    ) : (
      <p className="mt-1 text-[11px] text-[#171A18]/50">No file uploaded yet</p>
    )}
    {!disabled ? (
      <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#0B4F3C]/20 text-[11px] font-bold text-[#0B4F3C] cursor-pointer">
        <Upload className="w-3.5 h-3.5" />
        {uploading ? 'Uploading…' : 'Upload'}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files && e.target.files[0];
            if (file) onFile(file);
            e.target.value = '';
          }}
        />
      </label>
    ) : null}
  </div>
);
