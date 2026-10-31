import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Calculator, FilePlus, Receipt, Ban, FolderUp,
  IndianRupee, CalendarRange, Users, Wallet, UserPlus, Search,
  User, FileCheck, Landmark, CreditCard, KeyRound, GitBranch
} from 'lucide-react';
import api from '../../services/api';

const TILES = [
  { to: '/agent/plots', label: 'Plot availability', icon: MapPin, box: 'bg-emerald-500' },
  { to: '/agent/estimate', label: 'Estimate', icon: Calculator, box: 'bg-sky-500' },
  { to: '/agent/booking', label: 'Booking form', icon: FilePlus, box: 'bg-amber-500' },
  { to: '/agent/receipt', label: 'Customer receipt', icon: Receipt, box: 'bg-teal-600' },
  { to: '/agent/cancel', label: 'Cancel plot', icon: Ban, box: 'bg-rose-500' },
  { to: '/agent/customer-docs', label: 'Customer documents', icon: FolderUp, box: 'bg-indigo-500' },
  { to: '/agent/commission', label: 'Commission', icon: IndianRupee, box: 'bg-orange-500' },
  { to: '/agent/yearly-plan', label: 'Yearly plan', icon: CalendarRange, box: 'bg-cyan-600' },
  { to: '/agent/team-sales', label: 'Team sales', icon: Users, box: 'bg-lime-600' },
  { to: '/agent/collection', label: 'Collection', icon: Wallet, box: 'bg-fuchsia-600' },
  { to: '/agent/members', label: 'My members', icon: Users, box: 'bg-blue-600' },
  { to: '/mlm-tree', label: 'Member tree', icon: GitBranch, box: 'bg-violet-600' },
  { to: '/employees', label: 'Add executive', icon: UserPlus, box: 'bg-green-600' },
  { to: '/agent/search', label: 'Search executive', icon: Search, box: 'bg-yellow-500' },
  { to: '/agent/profile', label: 'My profile', icon: User, box: 'bg-slate-600' },
  { to: '/kyc', label: 'My documents', icon: FileCheck, box: 'bg-pink-600' },
  { to: '/agent/bank', label: 'Bank details', icon: Landmark, box: 'bg-emerald-700' },
  { to: '/agent/id-card', label: 'ID card', icon: CreditCard, box: 'bg-red-600' },
  { to: '/agent/password', label: 'Reset password', icon: KeyRound, box: 'bg-stone-600' },
];

export const AgentHomePage: React.FC = () => {
  const [home, setHome] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/agent/home').then((res) => setHome(res.data)).catch((err) => {
      setError(err?.response?.data?.message || 'Could not open your dashboard.');
    });
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 pb-10">
      <div className="rounded-2xl bg-[#0B4F3C] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[#C6A15B] font-bold">Welcome</p>
          <h2 className="font-serif text-2xl font-bold">{home?.fullName || 'Agent'}</h2>
          <p className="text-xs text-white/75 mt-1">{today}</p>
        </div>
        {home?.companyPhone && (
          <a href={`tel:${home.companyPhone}`} className="text-xs font-bold bg-white/10 border border-white/20 rounded-full px-3 py-1.5 w-fit">
            {home.companyPhone}
          </a>
        )}
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        <CountBox label="Executives" value={home?.executives} box="bg-emerald-500" />
        <CountBox label="Plots sold" value={home?.plotsSold} box="bg-sky-500" />
        <CountBox label="Confirmed" value={home?.confirmedBookings} box="bg-amber-500" />
      </div>

      <div className="rounded-2xl bg-[#C6A15B] text-[#171A18] px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide">Member ID</p>
          <p className="font-serif text-xl font-bold">{home?.employeeCode || '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide">Rank</p>
          <p className="text-sm font-bold">{home?.currentRank || '—'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to}
              to={tile.to}
              className={`${tile.box} text-white rounded-2xl min-h-[92px] p-3 flex flex-col justify-between shadow-sm hover:brightness-110`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-bold leading-tight">{tile.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

function CountBox({ label, value, box }: { label: string; value?: number; box: string }) {
  return (
    <div className={`${box} text-white rounded-2xl px-3 py-4 text-center shadow-sm`}>
      <p className="font-serif text-3xl font-bold">{value ?? '—'}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide mt-1">{label}</p>
    </div>
  );
}
