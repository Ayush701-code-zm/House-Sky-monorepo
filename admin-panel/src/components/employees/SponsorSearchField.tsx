import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';

export type SponsorHit = {
  id: string;
  fullName: string;
  employeeCode: string;
  currentRank: string;
};

interface SponsorSearchFieldProps {
  value: string;
  onChange: (id: string) => void;
  allowEmpty?: boolean;
  excludeId?: string;
  inputId?: string;
}

function employeeKey(emp: { id?: string; _id?: string }) {
  return String(emp.id || emp._id || '');
}

function toHit(emp: any): SponsorHit | null {
  const id = employeeKey(emp);
  if (!id) return null;
  return {
    id,
    fullName: emp.userId?.fullName || emp.employeeCode || 'Agent',
    employeeCode: emp.employeeCode || '',
    currentRank: emp.currentRank || '',
  };
}

export const SponsorSearchField: React.FC<SponsorSearchFieldProps> = ({
  value,
  onChange,
  allowEmpty = false,
  excludeId,
  inputId,
}) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SponsorHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState('');
  const [confirmed, setConfirmed] = useState<SponsorHit | null>(null);
  const known = useRef<SponsorHit | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    if (known.current?.id === value) {
      setConfirmed(known.current);
      setQuery(known.current.employeeCode);
      return;
    }
    let cancelled = false;
    api.get(`/employees/${value}`)
      .then((res) => {
        if (cancelled) return;
        const hit = toHit(res.data?.employee || res.data);
        if (!hit) return;
        known.current = hit;
        setConfirmed(hit);
        setQuery(hit.employeeCode);
      })
      .catch(() => {
        if (!cancelled) setConfirmed(null);
      });
    return () => { cancelled = true; };
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1 || (confirmed && q.toUpperCase() === confirmed.employeeCode.toUpperCase() && value)) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees', { params: { search: q } });
        if (cancelled) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        setHits(
          rows
            .map(toHit)
            .filter((hit): hit is SponsorHit => Boolean(hit) && hit.id !== excludeId)
            .slice(0, 8)
        );
        setSearched(q);
        setOpen(true);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, confirmed, value, excludeId]);

  const choose = (hit: SponsorHit) => {
    known.current = hit;
    setConfirmed(hit);
    setQuery(hit.employeeCode);
    setHits([]);
    setOpen(false);
    onChange(hit.id);
  };

  const clearSponsor = () => {
    known.current = null;
    setConfirmed(null);
    setQuery('');
    setHits([]);
    setOpen(false);
    onChange('');
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="text"
          value={query}
          autoComplete="off"
          placeholder="Name or member ID"
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);
            if (!confirmed || next.trim().toUpperCase() !== confirmed.employeeCode.toUpperCase()) {
              known.current = null;
              setConfirmed(null);
              if (value) onChange('');
            }
          }}
          onFocus={() => { if (hits.length) setOpen(true); }}
          className="w-full bg-white border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-[#171A18] font-bold focus:outline-none focus:border-[#0B4F3C]"
        />
        <span className="shrink-0 w-9 h-9 rounded-xl border border-[#0B4F3C]/20 text-[#0B4F3C] flex items-center justify-center">
          <Search className="w-4 h-4" />
        </span>
      </div>
      {open && (hits.length > 0 || loading) && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-[#0B4F3C]/20 rounded-xl shadow-lg overflow-hidden">
          {loading && hits.length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-[#171A18]/60">Searching…</li>
          ) : hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => choose(hit)}
                className="w-full text-left px-3 py-2 hover:bg-[#E8F0EC] cursor-pointer"
              >
                <span className="block text-xs font-bold text-[#171A18]">{hit.fullName}</span>
                <span className="block text-[10px] text-[#0B4F3C]">{hit.employeeCode}{hit.currentRank ? ` · ${hit.currentRank}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {confirmed && value ? (
        <p className="text-[11px] font-semibold text-[#0B4F3C] mt-1.5">
          {confirmed.fullName}
          <span className="font-medium text-[#171A18]/60"> · {confirmed.employeeCode}{confirmed.currentRank ? ` · ${confirmed.currentRank}` : ''}</span>
        </p>
      ) : query.trim() && !loading && searched === query.trim() && hits.length === 0 ? (
        <p className="text-[11px] font-semibold text-red-700 mt-1.5">No matching sponsor.</p>
      ) : allowEmpty ? (
        <p className="text-[10px] text-[#171A18]/50 mt-1">Leave blank to place this agent at the top of the network.</p>
      ) : null}
      {allowEmpty && value ? (
        <button type="button" onClick={clearSponsor} className="mt-1 text-[10px] font-bold text-[#0B4F3C] underline cursor-pointer">
          Clear sponsor
        </button>
      ) : null}
    </div>
  );
};
