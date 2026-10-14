import React, { useState } from 'react';
import { MLMTreeNode } from '../../types';
import { Award, ChevronDown, ChevronRight } from 'lucide-react';

interface MLMTreeVisualizerProps {
  treeData: MLMTreeNode;
}

const TreeNodeCard: React.FC<{ node: MLMTreeNode; level: number }> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Director Sales': return 'from-[#0B4F3C] to-[#063B2D] text-white border-[#0B4F3C]';
      case 'Associate Sales Director': return 'from-sky-700 to-sky-900 text-white border-sky-800';
      case 'Business Development Manager': return 'from-emerald-700 to-teal-900 text-white border-emerald-800';
      case 'Sr Team Leader': return 'from-emerald-600 to-teal-700 text-white border-emerald-600';
      case 'Team Leader': return 'from-green-600 to-emerald-700 text-white border-green-600';
      case 'Sr Business Executive': return 'from-amber-600 to-orange-700 text-white border-amber-600';
      default: return 'from-slate-700 to-slate-800 text-white border-slate-600';
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#0B4F3C]/20 hover:border-[#0B4F3C]/50 transition-all w-72 shadow-md relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B4F3C] text-white flex items-center justify-center font-bold text-sm shadow-md">
              {node.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-serif font-bold text-sm text-[#171A18] leading-none">{node.name}</h4>
                {node.legNumber && (
                  <span className="px-1.5 py-0.5 rounded text-[8.5px] font-extrabold uppercase bg-[#E8F0EC] text-[#0B4F3C] border border-[#0B4F3C]/30">
                    Leg #{node.legNumber}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#0B4F3C] font-mono font-bold mt-1">{node.employeeCode}</p>
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg bg-[#E8F0EC] text-[#0B4F3C] hover:bg-[#0B4F3C] hover:text-white transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Rank Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r ${getRankColor(node.currentRank)} border`}>
            <Award className="w-3 h-3 inline mr-1" />
            {node.currentRank}
          </span>
          <span className="text-xs font-extrabold text-[#0B4F3C]">
            {node.commissionPercent}% Comm
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#0B4F3C]/15 text-center text-[10px]">
          <div className="bg-[#E8F0EC] p-1.5 rounded-lg border border-[#0B4F3C]/20">
            <p className="text-[#171A18]/70 font-semibold text-[9px]">Self Sales</p>
            <p className="font-bold text-[#171A18] text-xs mt-0.5">{node.selfSalesCount}</p>
          </div>
          <div className="bg-[#E8F0EC] p-1.5 rounded-lg border border-[#0B4F3C]/20">
            <p className="text-[#171A18]/70 font-semibold text-[9px]">Team Sales</p>
            <p className="font-bold text-[#0B4F3C] text-xs mt-0.5">{node.teamSalesCount}</p>
          </div>
          <div className="bg-[#E8F0EC] p-1.5 rounded-lg border border-[#0B4F3C]/20">
            <p className="text-[#171A18]/70 font-semibold text-[9px]">Active Legs</p>
            <p className="font-bold text-[#0B4F3C] text-xs mt-0.5">{node.activeLegsCount}</p>
          </div>
        </div>
      </div>

      {/* Vertical Connecting Line */}
      {isExpanded && node.children && node.children.length > 0 && (
        <div className="w-0.5 h-6 bg-[#0B4F3C]/30"></div>
      )}

      {/* Children Nodes Horizontal Tree */}
      {isExpanded && node.children && node.children.length > 0 && (
        <div className="flex gap-8 relative pt-4 before:content-[''] before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-[calc(100%-18rem)] before:h-0.5 before:bg-[#0B4F3C]/30">
          {node.children.map((child) => (
            <div key={child.id} className="relative before:content-[''] before:absolute before:-top-4 before:left-1/2 before:-translate-x-1/2 before:w-0.5 before:h-4 before:bg-[#0B4F3C]/30">
              <TreeNodeCard node={child} level={level + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MLMTreeVisualizer: React.FC<MLMTreeVisualizerProps> = ({ treeData }) => {
  return (
    <div className="w-full overflow-x-auto p-8 bg-[#FDFCF0] rounded-2xl border border-[#0B4F3C]/15 min-h-[500px] flex justify-center shadow-inner">
      {treeData ? (
        <TreeNodeCard node={treeData} level={0} />
      ) : (
        <p className="text-[#171A18]/70 font-bold">Loading MLM Tree structure...</p>
      )}
    </div>
  );
};
