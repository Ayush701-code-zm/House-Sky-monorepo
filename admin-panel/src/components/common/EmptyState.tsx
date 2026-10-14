import React from 'react';
import { FolderOpen, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'There are no records available to display at this moment.',
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#0B4F3C]/15 p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto my-6 animate-in fade-in duration-200">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F0EC] border border-[#0B4F3C]/20 flex items-center justify-center mx-auto text-[#0B4F3C] shadow-sm">
        <Icon className="w-8 h-8 text-[#0B4F3C]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-serif font-bold text-[#171A18]">{title}</h3>
        <p className="text-xs text-[#171A18]/70 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-5 py-2.5 bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
