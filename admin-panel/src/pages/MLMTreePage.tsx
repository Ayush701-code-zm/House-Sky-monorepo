import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { MLMTreeNode, Employee } from '../types';
import { MLMTreeVisualizer } from '../components/mlm/MLMTreeVisualizer';
import { InviteLinkCard } from '../components/employees/InviteLinkCard';
import { Award, ShieldCheck, ChevronDown, ChevronUp, Users, Filter } from 'lucide-react';

export const MLMTreePage: React.FC = () => {
  const [treeData, setTreeData] = useState<MLMTreeNode | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRootId, setSelectedRootId] = useState<string>('');
  const [rankRules, setRankRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showMatrix, setShowMatrix] = useState<boolean>(false); // Collapsed by default for clean space!

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [treeRes, rulesRes, empRes] = await Promise.all([
        api.get('/mlm/tree'),
        api.get('/mlm/rank-rules'),
        api.get('/employees')
      ]);

      setTreeData(treeRes.data);
      setRankRules(rulesRes.data);
      setEmployees(empRes.data);

      if (treeRes.data && treeRes.data.id) {
        setSelectedRootId(treeRes.data.id);
      }
    } catch (error) {
      console.error('Failed to load MLM network data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootChange = async (rootId: string) => {
    if (!rootId) return;
    setSelectedRootId(rootId);
    try {
      setIsLoading(true);
      const treeRes = await api.get(`/mlm/tree?rootId=${rootId}`);
      setTreeData(treeRes.data);
    } catch (error) {
      console.error('Failed to fetch tree for root ID', error);
    } finally {
      setIsLoading(false);
    }
  };

  const salesDirectors = employees.filter(
    (e) => e.currentRank === 'Director Sales' || e.currentRank === 'Associate Sales Director'
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <InviteLinkCard />
      {/* Sleek Page Header Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#171A18] tracking-tight">
            Multi-Level Network Hierarchy
          </h2>
          <p className="text-xs text-[#171A18]/60 mt-0.5 font-light">
            Interactive downline tree visualizer & Sales Director network topology
          </p>
        </div>

        {/* Tree Root Leader Selector Dropdown & Filter Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showMatrix
                ? 'bg-[#0B4F3C] text-white border-[#0B4F3C]'
                : 'bg-[#FDFCF0] text-[#0B4F3C] hover:bg-[#E8F0EC] border-[#0B4F3C]/20'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Rank Matrix & Rules</span>
            {showMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-2 bg-[#FDFCF0] px-3.5 py-1.5 rounded-xl border border-[#0B4F3C]/15">
            <ShieldCheck className="w-4 h-4 text-[#0B4F3C] shrink-0" />
            <select
              value={selectedRootId}
              onChange={(e) => handleRootChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#171A18] focus:outline-none cursor-pointer"
            >
              <option value="">-- Select Root Leader --</option>
              {employees.map((emp) => {
                const empId = (emp as any)._id || emp.id;
                const empName = emp.userId ? emp.userId.fullName : emp.employeeCode;
                return (
                  <option key={empId} value={empId}>
                    {empName} ({emp.employeeCode} - {emp.currentRank})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Qualification Matrix & Directors Section */}
      {showMatrix && (
        <div className="space-y-4 animate-in slide-in-from-top-3 duration-200">
          {/* Top Sales Directors Pill Bar */}
          {salesDirectors.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-[#0B4F3C]/10 flex items-center gap-3 flex-wrap shadow-xs">
              <span className="text-xs font-bold text-[#0B4F3C] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0B4F3C]" /> Top Directors ({salesDirectors.length}):
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {salesDirectors.map((dir) => {
                  const dirId = (dir as any)._id || dir.id;
                  const dirName = dir.userId ? dir.userId.fullName : dir.employeeCode;
                  const isSelected = selectedRootId === dirId;
                  return (
                    <button
                      key={dirId}
                      onClick={() => handleRootChange(dirId)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B4F3C] text-white border-[#0B4F3C] shadow-xs'
                          : 'bg-[#FDFCF0] text-[#0B4F3C] hover:bg-[#E8F0EC] border-[#0B4F3C]/20'
                      }`}
                    >
                      ⭐ {dirName} ({dir.currentRank})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Qualification Matrix Cards */}
          <div className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/10 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#0B4F3C] uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4" /> Business Plan Qualification Matrix
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {rankRules.map((rule, idx) => (
                <div key={idx} className="bg-[#FDFCF0] p-3 rounded-xl border border-[#0B4F3C]/15 hover:border-[#0B4F3C]/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171A18]">{rule.rank}</span>
                    <span className="text-[#0B4F3C] font-extrabold">{rule.commissionPercent}%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-[#171A18]/70 space-y-0.5">
                    <p>Self Sales: <span className="text-[#171A18] font-bold">{rule.minSelfSales}</span></p>
                    <p>Team Sales: <span className="text-[#171A18] font-bold">{rule.minTeamSales}</span></p>
                    <p>Min Legs: <span className="text-[#171A18] font-bold">{rule.minLegs}</span></p>
                    {rule.timeLimitDays && (
                      <p className="text-amber-700 font-semibold mt-1">Window: 2 Months</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Focus: Visual Tree Graph Container */}
      {isLoading ? (
        <div className="flex justify-center p-16 bg-white rounded-2xl border border-[#0B4F3C]/10 shadow-xs">
          <div className="w-8 h-8 border-4 border-[#0B4F3C] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : treeData ? (
        <MLMTreeVisualizer treeData={treeData} />
      ) : (
        <div className="text-center p-12 bg-white rounded-2xl border border-[#0B4F3C]/10 text-[#171A18]/60 text-xs">
          No downline hierarchy data available for this root leader.
        </div>
      )}
    </div>
  );
};
