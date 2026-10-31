import React, { useState } from 'react';
import { X, UserPlus, GitMerge } from 'lucide-react';
import api from '../../services/api';
import { RANKS } from '../../types';
import { useToast } from '../../context/ToastContext';
import { DraftNotice } from '../common/DraftNotice';
import { clearDraft } from '../../utils/formDraft';
import { mergeDraft, usePersistDraft } from '../../utils/useFormDraft';
import { SponsorSearchField } from './SponsorSearchField';
import { useAuth } from '../../context/AuthContext';

const EMPLOYEE_DRAFT_KEY = 'hs-admin-employee-new';
const EMPLOYEE_DEFAULTS = {
  fullName: '',
  email: '',
  phone: '',
  role: 'AGENT',
  currentRank: 'Advisor',
  parentId: '',
  legNumber: 1,
};

interface AddEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onDiscardDraft?: () => void;
}

const AddEmployeeModalBody: React.FC<AddEmployeeModalProps> = ({ onClose, onSuccess, onDiscardDraft }) => {
  const toast = useToast();
  const { user, employee } = useAuth();
  const lockedSponsor = user?.role === 'AGENT' && employee?.id ? employee.id : '';
  const [boot] = useState(() => mergeDraft(EMPLOYEE_DRAFT_KEY, EMPLOYEE_DEFAULTS));
  const initial = boot.value;
  const [draftRestored] = useState(boot.restored);
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState(initial.role);
  const [currentRank, setCurrentRank] = useState(initial.currentRank);
  const [parentId, setParentId] = useState(initial.parentId || lockedSponsor);
  const [legNumber, setLegNumber] = useState<number>(initial.legNumber);
  const clearEmployeeDraft = usePersistDraft(EMPLOYEE_DRAFT_KEY, {
    fullName, email, phone, role, currentRank, parentId, legNumber,
  }, EMPLOYEE_DEFAULTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setIsSubmitting(true);
      await api.post('/employees', {
        fullName,
        email,
        phone,
        password,
        role,
        currentRank,
        parentId: parentId || null,
        legNumber
      });

      clearEmployeeDraft();
      toast.success('Agent / Employee onboarded successfully into MLM network!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err?.friendlyMessage || 'Failed to register agent/employee';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#0B4F3C]/20 w-full max-w-lg rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#171A18]">Onboard Agent / Employee</h3>
              <p className="text-xs text-[#171A18]/70">Add new sales executive or system role user</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {draftRestored && onDiscardDraft && <DraftNotice onDiscard={onDiscardDraft} />}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[#171A18]/70 font-semibold">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ananya Deshmukh"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Email Address</label>
              <input
                type="email"
                required
                placeholder="ananya@houseandsky.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Phone Number</label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>
          {role === 'AGENT' && (
            <p className="text-xs font-semibold text-[#0B4F3C] bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              The same email and the same mobile can be used for up to 3 member IDs. Sign in to each one with its member ID.
            </p>
          )}

          <div>
            <label className="text-[#171A18]/70 font-semibold">Initial Password</label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
            />
          </div>

          <div className="p-3.5 bg-[#E8F0EC] border border-[#0B4F3C]/20 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                >
                  <option value="AGENT">AGENT</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <label className="text-[#171A18]/70 font-semibold block mb-1">Initial MLM Rank</label>
                <select
                  value={currentRank}
                  onChange={(e) => setCurrentRank(e.target.value)}
                  className="w-full bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
                >
                  {RANKS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* MLM Hierarchy & Placement Leg */}
            <div className="border-t border-[#0B4F3C]/15 pt-3 space-y-2">
              <label className="text-[#0B4F3C] font-bold flex items-center gap-1.5 text-[11px]">
                <GitMerge className="w-3.5 h-3.5 text-[#0B4F3C]" /> Sponsorship &amp; leg placement
              </label>

                <div>
                  <label className="text-[#171A18]/70 font-semibold block mb-1">Sponsorship</label>
                  {lockedSponsor ? (
                    <p className="mt-1 text-[#0B4F3C] font-bold">This new executive will join under you ({employee?.employeeCode}).</p>
                  ) : (
                    <SponsorSearchField value={parentId} onChange={setParentId} allowEmpty inputId="add-employee-sponsor" />
                  )}
                </div>

                <div>
                  <label className="text-[#171A18]/70 font-semibold block mb-1">
                    Leg Number
                    <span className="ml-2 text-[#0B4F3C]/70 font-normal">(Leg #1, #2, #3 ... unlimited)</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="leg-number-input"
                      type="number"
                      min={1}
                      max={999}
                      value={legNumber}
                      onChange={(e) => setLegNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-24 bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] text-center"
                    />
                    <div className="flex gap-1 flex-wrap">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setLegNumber(n)}
                          className={`w-8 h-8 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                            legNumber === n
                              ? 'bg-[#0B4F3C] text-white border-[#0B4F3C] shadow-md'
                              : 'bg-white text-[#0B4F3C] border-[#0B4F3C]/20 hover:bg-[#E8F0EC]'
                          }`}
                        >
                          #{n}
                        </button>
                      ))}
                      <span className="text-[10px] text-[#171A18]/50 self-center ml-1 font-semibold">or type any number →</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#171A18]/50 mt-1">
                    No limit on legs per sponsor. Each agent under the same parent gets a unique leg number.
                  </p>
                </div>
              </div>
          </div>

          <div className="pt-4 border-t border-[#0B4F3C]/15 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#FDFCF0] border border-[#0B4F3C]/20 font-bold text-xs text-[#171A18]/70 hover:text-[#171A18]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] font-bold text-xs text-white shadow-md cursor-pointer border border-[#0B4F3C]"
            >
              {isSubmitting ? 'Onboarding...' : 'Onboard Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = (props) => {
  const [session, setSession] = useState(0);
  return (
    <AddEmployeeModalBody
      key={session}
      {...props}
      onDiscardDraft={() => {
        clearDraft(EMPLOYEE_DRAFT_KEY);
        setSession((n) => n + 1);
      }}
    />
  );
};
