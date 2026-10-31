import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Users, Wallet, UserRound } from 'lucide-react';
import api from '../../services/api';
import { StatCard } from '../../components/dashboard/StatCard';

/** Agent desk. Grouped lists, not a tile wall. */
const GROUPS = [
  {
    title: 'Inventory',
    icon: MapPin,
    items: [
      { to: '/agent/plots', label: 'Open a project', hint: 'Counts, plot list, and the details of one plot' },
      { to: '/agent/estimate', label: 'Price a plot', hint: 'See the price already stored for that unit' },
      { to: '/agent/booking', label: 'Start a booking', hint: 'Customer file, deposit photo, then company check' },
    ],
  },
  {
    title: 'Your records',
    icon: Wallet,
    items: [
      { to: '/agent/receipt', label: 'Customer receipt', hint: 'Print a confirmed booking' },
      { to: '/agent/cancel', label: 'Cancel a booking', hint: 'Withdraw a pending file, or ask to release a confirmed one' },
      { to: '/agent/customer-docs', label: 'Add a customer file', hint: 'Attach another document to a booking' },
      { to: '/agent/commission', label: 'Commission', hint: 'What this login has earned' },
      { to: '/agent/yearly-plan', label: 'This year’s target', hint: 'Plots and amount against what you have booked' },
    ],
  },
  {
    title: 'Team',
    icon: Users,
    items: [
      { to: '/agent/team-sales', label: 'Team bookings', hint: 'One person, a date range, summary or each sale' },
      { to: '/agent/collection', label: 'Money collected', hint: 'Booking amounts recorded for your team' },
      { to: '/agent/members', label: 'People under you', hint: 'Member ID, rank, and joining' },
      { to: '/mlm-tree', label: 'Network tree', hint: 'The same downline as a tree' },
      { to: '/employees', label: 'Add an executive', hint: 'They join under your member ID' },
      { to: '/agent/search', label: 'Find an executive', hint: 'Search by name or member ID' },
    ],
  },
  {
    title: 'Account',
    icon: UserRound,
    items: [
      { to: '/agent/profile', label: 'Profile', hint: 'Name and phone on this login' },
      { to: '/kyc', label: 'Your documents', hint: 'PAN, Aadhaar, and nominee for you' },
      { to: '/agent/bank', label: 'Payout account', hint: 'Where your commission is sent' },
      { to: '/agent/id-card', label: 'ID card', hint: 'Printable card with your member ID' },
      { to: '/agent/password', label: 'Password', hint: 'Replace the password for this login' },
    ],
  },
];

export const AgentHomePage: React.FC = () => {
  const [home, setHome] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/agent/home').then((res) => setHome(res.data)).catch((err) => {
      setError(err?.response?.data?.message || 'Could not open your dashboard.');
    });
  }, []);

  const initial = (home?.fullName || 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#171A18]">Your desk</h2>
          <p className="text-xs text-[#171A18]/70 mt-1">Bookings, plots, and the people who joined under you</p>
        </div>
        {home?.companyPhone && (
          <a href={`tel:${home.companyPhone}`} className="text-xs font-bold text-[#0B4F3C] bg-[#E8F0EC] border border-[#0B4F3C]/15 rounded-full px-3 py-1.5">
            Desk {home.companyPhone}
          </a>
        )}
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <div className="bg-white border border-[#0B4F3C]/15 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0B4F3C] text-white font-serif text-2xl flex items-center justify-center">{initial}</div>
        <div>
          <p className="font-serif text-xl font-bold text-[#171A18]">{home?.fullName || 'Loading…'}</p>
          <p className="text-xs text-[#171A18]/70 mt-1">{home?.currentRank} · {home?.employeeCode}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="People under you" value={home?.executives ?? '—'} icon={Users} subtitle="Direct and further down the line" />
        <StatCard title="Plots sold" value={home?.plotsSold ?? '—'} icon={MapPin} subtitle="Confirmed bookings now marked sold" />
        <StatCard title="Confirmed bookings" value={home?.confirmedBookings ?? '—'} icon={Wallet} subtitle="Waiting on agreement or sale" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title} className="bg-white border border-[#0B4F3C]/15 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#0B4F3C]/10 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#0B4F3C]" />
                <h3 className="text-sm font-bold text-[#0B4F3C]">{group.title}</h3>
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item.to} className="border-t border-[#0B4F3C]/10 first:border-t-0">
                    <Link to={item.to} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#FDFCF0]">
                      <span>
                        <span className="block text-sm font-bold text-[#171A18]">{item.label}</span>
                        <span className="block text-xs text-[#171A18]/60 mt-0.5">{item.hint}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#0B4F3C] shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
