import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, CreditCard, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { AgentKyc, Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface RequestPayoutModalProps {
  employees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_ROLES = ['ADMIN', 'DIRECTOR'];
const KYC_APPROVED = 'APPROVED';

function recordId(emp: Employee | null | undefined): string {
  if (!emp) return '';
  return String(emp.id || emp._id || '');
}

export const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({
  employees,
  onClose,
  onSuccess
}) => {
  const { employee: loggedInEmployee, user } = useAuth();
  const toast = useToast();
  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));

  const [employeeId, setEmployeeId] = useState<string>(recordId(loggedInEmployee));
  const [kyc, setKyc] = useState<AgentKyc | null>(null);
  const [payoutEligible, setPayoutEligible] = useState(false);
  const [kycMessage, setKycMessage] = useState('');
  const [isLoadingKyc, setIsLoadingKyc] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadKyc = async () => {
      if (!employeeId) {
        setKyc(null);
        setPayoutEligible(false);
        setIsLoadingKyc(false);
        return;
      }
      setIsLoadingKyc(true);
      try {
        const isSelf = employeeId === recordId(loggedInEmployee);
        const res = isSelf
          ? await api.get('/kyc/me')
          : await api.get(`/kyc/employee/${employeeId}`);
        const nextKyc = res.data?.kyc || null;
        const eligible = Boolean(res.data?.payoutEligible) || nextKyc?.status === KYC_APPROVED;
        setKyc(nextKyc);
        setPayoutEligible(eligible);
        setKycMessage(res.data?.message || '');
      } catch (err: any) {
        setKyc(null);
        setPayoutEligible(false);
        setKycMessage(err?.friendlyMessage || 'Could not load KYC');
      } finally {
        setIsLoadingKyc(false);
      }
    };
    loadKyc();
  }, [employeeId, loggedInEmployee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutEligible) {
      toast.error('Approved KYC is required before requesting a payout');
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/payouts/request', {
        employeeId: employeeId || recordId(loggedInEmployee)
      });
      toast.success('Payout request submitted. Amount is taken from unpaid commissions.');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error?.friendlyMessage || 'Failed to submit payout request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSelf = employeeId === recordId(loggedInEmployee);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#0B4F3C]/20 w-full max-w-md rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B4F3C] text-white flex items-center justify-center shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#171A18]">Request Commission Payout</h3>
              <p className="text-xs text-[#171A18]/70">Bank details come from approved KYC only</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isAdmin ? (
            <div>
              <label className="text-[#171A18]/70 font-semibold">Select Beneficiary Agent</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              >
                {employees.map((emp) => {
                  const id = recordId(emp);
                  return (
                    <option key={id} value={id}>
                      {emp.userId ? emp.userId.fullName : emp.employeeCode} ({emp.employeeCode} - {emp.currentRank})
                      {id === recordId(loggedInEmployee) ? ' [YOU]' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : null}

          <p className="text-[11px] text-[#171A18]/70 bg-[#FDFCF0] rounded-xl px-3 py-2 border border-[#0B4F3C]/10">
            Payout amount is calculated from unpaid commissions. It cannot be typed in this form.
          </p>

          {isLoadingKyc ? (
            <p className="text-[#171A18]/60">Checking KYC status…</p>
          ) : payoutEligible && kyc ? (
            <div className="p-3 bg-[#E8F0EC] rounded-xl border border-[#0B4F3C]/20 space-y-2">
              <p className="font-bold text-[#0B4F3C] text-[11px]">Approved bank details</p>
              <p className="font-semibold">{kyc.accountHolderName}</p>
              <p className="font-mono">{kyc.accountNumber} · {kyc.ifscCode}</p>
              <p>{kyc.bankName}{kyc.branchName ? ` · ${kyc.branchName}` : ''}</p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> KYC required
              </p>
              <p>
                {kycMessage || 'Manager/admin must approve KYC before a payout can be requested.'}
              </p>
              {isSelf ? (
                <Link to="/kyc" onClick={onClose} className="inline-block font-bold underline">
                  Complete My KYC
                </Link>
              ) : null}
            </div>
          )}

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
              disabled={isSubmitting || !payoutEligible}
              className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] font-bold text-xs text-white shadow-md cursor-pointer border border-[#0B4F3C] disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
