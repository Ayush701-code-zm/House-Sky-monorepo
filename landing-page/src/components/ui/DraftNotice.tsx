'use client'

export function DraftNotice({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-green/20 bg-brand-soft px-4 py-3 text-sm text-brand-charcoal">
      <span className="font-semibold">Your last details are still here.</span>
      <button type="button" onClick={onDiscard} className="font-bold text-brand-green underline shrink-0">
        Start over
      </button>
    </div>
  )
}
