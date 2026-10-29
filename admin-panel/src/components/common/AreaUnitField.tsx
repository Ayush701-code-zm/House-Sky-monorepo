import { useEffect, useRef, useState } from 'react';
import { AREA_UNITS, AreaUnit, sqftToUnit, unitToSqft } from '../../utils/areaUnits';

type Props = {
  sqft: number;
  onSqftChange: (sqft: number, unit: AreaUnit) => void;
  initialUnit?: AreaUnit;
  label?: string;
  required?: boolean;
  variant?: 'light' | 'dark';
  showSavedHint?: boolean;
};

export default function AreaUnitField({
  sqft,
  onSqftChange,
  initialUnit = 'sqft',
  label = 'Total area',
  required = false,
  variant = 'light',
  showSavedHint = true,
}: Props) {
  const [unit, setUnit] = useState<AreaUnit>(initialUnit);
  const [text, setText] = useState(() => (sqft ? String(sqftToUnit(sqft, initialUnit)) : ''));
  const focused = useRef(false);

  useEffect(() => {
    if (focused.current) return;
    setText(sqft ? String(sqftToUnit(sqft, unit)) : '');
  }, [sqft, unit]);

  const inputClass = variant === 'dark'
    ? 'w-full px-3 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400 focus:outline-none'
    : 'w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]';
  const selectClass = variant === 'dark'
    ? 'px-2 py-1.5 bg-neutral-950 border border-white/15 rounded-lg text-white font-medium focus:border-emerald-400 focus:outline-none'
    : 'px-2 py-2 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]';
  const labelClass = variant === 'dark'
    ? 'text-[10px] font-bold text-neutral-400 uppercase block mb-1'
    : 'text-[#171A18]/70 font-semibold block mb-1 text-xs';
  const hintClass = variant === 'dark'
    ? 'text-[10px] text-neutral-500 mt-1'
    : 'text-[10px] text-[#171A18]/50 mt-1';

  const applyText = (raw: string, nextUnit: AreaUnit) => {
    setText(raw);
    if (raw.trim() === '') {
      onSqftChange(0, nextUnit);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onSqftChange(unitToSqft(n, nextUnit), nextUnit);
  };

  const switchUnit = (next: AreaUnit) => {
    const n = Number(text);
    const currentSqft = text.trim() === '' || !Number.isFinite(n) ? sqft : unitToSqft(n, unit);
    setUnit(next);
    setText(currentSqft ? String(sqftToUnit(currentSqft, next)) : '');
    onSqftChange(currentSqft, next);
  };

  return (
    <div>
      <label className={labelClass}>
        {label}{required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          step="any"
          required={required}
          value={text}
          onFocus={() => { focused.current = true; }}
          onBlur={() => { focused.current = false; }}
          onChange={(e) => applyText(e.target.value, unit)}
          className={inputClass}
        />
        <select
          value={unit}
          onChange={(e) => switchUnit(e.target.value as AreaUnit)}
          className={selectClass}
          aria-label="Area unit"
        >
          {AREA_UNITS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>
      {showSavedHint && unit !== 'sqft' && sqft > 0 && (
        <p className={hintClass}>Saved as {sqft.toLocaleString('en-IN')} sq ft</p>
      )}
    </div>
  );
}
