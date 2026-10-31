import React, { useEffect, useState } from 'react';
import { X, Award, RefreshCw, Edit3 } from 'lucide-react';
import api from '../../services/api';
import { Employee, RANKS } from '../../types';
import { SponsorSearchField } from './SponsorSearchField';
import { useToast } from '../../context/ToastContext';
import { DraftNotice } from '../common/DraftNotice';
import { readDraft } from '../../utils/formDraft';
import { usePersistDraft } from '../../utils/useFormDraft';

type AgentDraft = {
  fullName: string;
  phone: string;
  currentRank: string;
  parentId: string;
  legNumber: number;
};

interface AgentProfileModalProps {
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AgentProfileModal: React.FC<AgentProfileModalProps> = ({
  employeeId,
  onClose,
  onSuccess
}) => {
  const toast = useToast();
  const [data, setData] = useState<{ employee: Employee; metrics: any } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Editable Form Fields
  const draftKey = `hs-admin-agent-${employeeId}`;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentRank, setCurrentRank] = useState('');
  const [parentId, setParentId] = useState('');
  const [legNumber, setLegNumber] = useState<number>(1);
  const [baseline, setBaseline] = useState<AgentDraft | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const clearAgentDraft = usePersistDraft(draftKey, {
    fullName, phone, currentRank, parentId, legNumber,
  }, baseline, baseline != null);

  useEffect(() => {
    fetchAgentDetails();
  }, [employeeId]);

  const fetchAgentDetails = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/employees/${employeeId}`);
      setData(res.data);

      const emp: Employee = res.data.employee;
      const server: AgentDraft = {
        fullName: emp.userId?.fullName || '',
        phone: emp.userId?.phone || '',
        currentRank: emp.currentRank || 'Advisor',
        parentId: emp.parentId && typeof emp.parentId === 'object' ? (emp.parentId as any)._id || (emp.parentId as any).id : (emp.parentId || ''),
        legNumber: emp.legNumber || 1,
      };
      const saved = readDraft<AgentDraft>(draftKey);
      const next = saved ? { ...server, ...saved } : server;
      setFullName(next.fullName);
      setPhone(next.phone);
      setCurrentRank(next.currentRank);
      setParentId(next.parentId);
      setLegNumber(next.legNumber);
      setBaseline(server);
      setDraftRestored(Boolean(saved && JSON.stringify(next) !== JSON.stringify(server)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await api.put(`/employees/${employeeId}`, {
        fullName,
        phone,
        currentRank,
        parentId: parentId || null,
        legNumber
      });

      clearAgentDraft();
      toast.success('Agent profile and rank updated successfully!');
      onSuccess();
      fetchAgentDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update agent details');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEvaluateRank = async () => {
    try {
      setIsUpdating(true);
      const res = await api.post(`/employees/${employeeId}/evaluate-rank`);
      if (res.data.upgraded) {
        toast.success(`🎉 Rank Upgraded! Agent promoted to ${res.data.newRank}`);
      } else {
        toast.info(`Current rank "${currentRank}" is optimal based on sales volume.`);
      }
      onSuccess();
      fetchAgentDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to evaluate rank');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white p-8 rounded-3xl border border-[#0B4F3C]/20 flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-[#0B4F3C] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#171A18]">Loading Agent Performance Dossier...</span>
        </div>
      </div>
    );
  }

  const { employee, metrics } = data;
  const user = employee.userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#0B4F3C]/20 w-full max-w-2xl rounded-3xl p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#0B4F3C]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0B4F3C] text-white flex items-center justify-center font-bold text-lg shadow-md">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-serif font-bold text-[#171A18]">{user?.fullName || 'Sales Executive'}</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F0EC] text-[#0B4F3C] text-[10px] font-bold border border-[#0B4F3C]/20">
                  {employee.currentRank}
                </span>
              </div>
              <p className="text-xs text-[#171A18]/70 mt-0.5 font-mono font-bold">
                Code: {employee.employeeCode} • Joined: {new Date(employee.joiningDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Performance KPI Stat Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#E8F0EC] p-3 rounded-2xl border border-[#0B4F3C]/20 text-center">
            <p className="text-[10px] font-bold text-[#171A18]/70 uppercase">Self Sales</p>
            <p className="text-lg font-extrabold text-[#171A18] mt-0.5">{metrics?.selfSalesCount || employee.selfSalesCount || 0} Plots</p>
          </div>
          <div className="bg-[#E8F0EC] p-3 rounded-2xl border border-[#0B4F3C]/20 text-center">
            <p className="text-[10px] font-bold text-[#171A18]/70 uppercase">Team Sales</p>
            <p className="text-lg font-extrabold text-[#0B4F3C] mt-0.5">{metrics?.teamSalesCount || employee.teamSalesCount || 0} Plots</p>
          </div>
          <div className="bg-[#E8F0EC] p-3 rounded-2xl border border-[#0B4F3C]/20 text-center">
            <p className="text-[10px] font-bold text-[#171A18]/70 uppercase">Active Legs</p>
            <p className="text-lg font-extrabold text-sky-800 mt-0.5">{metrics?.activeLegsCount || employee.activeLegsCount || 0} Legs</p>
          </div>
          <div className="bg-[#E8F0EC] p-3 rounded-2xl border border-[#0B4F3C]/20 text-center">
            <p className="text-[10px] font-bold text-[#171A18]/70 uppercase">Sponsor Leg #</p>
            <p className="text-lg font-extrabold text-[#0B4F3C] mt-0.5">#{employee.legNumber || 1}</p>
          </div>
        </div>

        {/* AI Auto-Rank Evaluation Banner */}
        <div className="p-4 bg-[#FDFCF0] rounded-2xl border border-[#0B4F3C]/15 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#0B4F3C]" />
            <div>
              <p className="font-bold text-[#171A18]">Hippo MLM Auto-Promotion System</p>
              <p className="text-[10px] text-[#171A18]/70 mt-0.5">Evaluates downline sales volume & active legs against 7 rank milestones</p>
            </div>
          </div>
          <button
            onClick={handleEvaluateRank}
            disabled={isUpdating}
            className="px-3.5 py-2 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer border border-[#0B4F3C]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Evaluate Rank
          </button>
        </div>

        {/* Agent Profile Details & Edit Form */}
        {draftRestored && baseline && (
          <DraftNotice onDiscard={() => {
            clearAgentDraft();
            setFullName(baseline.fullName);
            setPhone(baseline.phone);
            setCurrentRank(baseline.currentRank);
            setParentId(baseline.parentId);
            setLegNumber(baseline.legNumber);
            setDraftRestored(false);
          }} />
        )}

        <form onSubmit={handleUpdate} className="space-y-4 text-xs">
          <h4 className="font-serif font-bold text-[#171A18] uppercase tracking-wider border-b border-[#0B4F3C]/15 pb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#0B4F3C]" /> Modify Profile & MLM Rank
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#171A18]/70 font-semibold">Assigned MLM Rank</label>
              <select
                value={currentRank}
                onChange={(e) => setCurrentRank(e.target.value)}
                className="w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
              >
                {RANKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[#171A18]/70 font-semibold">Sponsorship</label>
              <div className="mt-1">
                <SponsorSearchField value={parentId} onChange={setParentId} allowEmpty excludeId={employeeId} inputId="agent-sponsor" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[#171A18]/70 font-semibold">
              Leg Number Under Sponsor
              <span className="ml-2 text-[#0B4F3C]/70 font-normal">(#1, #2, #3 ... unlimited)</span>
            </label>
            <div className="flex items-center gap-3 mt-1">
              <input
                id="agent-leg-number-input"
                type="number"
                min={1}
                max={999}
                value={legNumber}
                onChange={(e) => setLegNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C] text-center"
              />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLegNumber(n)}
                    className={`w-8 h-8 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                      legNumber === n
                        ? 'bg-[#0B4F3C] text-white border-[#0B4F3C]'
                        : 'bg-[#FDFCF0] text-[#0B4F3C] border-[#0B4F3C]/20 hover:bg-[#E8F0EC]'
                    }`}
                  >
                    #{n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#0B4F3C]/15 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#FDFCF0] border border-[#0B4F3C]/20 font-bold text-xs text-[#171A18]/70 hover:text-[#171A18]"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] font-bold text-xs text-white shadow-md cursor-pointer border border-[#0B4F3C]"
            >
              {isUpdating ? 'Saving...' : 'Save Agent Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
