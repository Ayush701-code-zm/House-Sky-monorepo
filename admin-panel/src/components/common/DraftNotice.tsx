import React from 'react';

export function DraftNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#E8F0EC] px-3 py-2 text-xs text-[#0B4F3C]">
      <span className="font-semibold">Restored the details from when this window was closed.</span>
      <button type="button" onClick={onDiscard} className="font-bold underline cursor-pointer shrink-0">
        Discard draft
      </button>
    </div>
  );
}
