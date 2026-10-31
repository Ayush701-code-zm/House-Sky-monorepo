import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export const fieldClass = 'w-full mt-1 bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 text-sm text-[#171A18] font-semibold focus:outline-none focus:border-[#0B4F3C]';

export function PageFrame({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5 pb-10">
      <div className="rounded-2xl bg-[#0B4F3C] text-white px-5 py-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold">{title}</h2>
          {note && <p className="text-xs text-white/75 mt-1">{note}</p>}
        </div>
        <Link to="/agent" className="text-xs font-bold text-[#171A18] bg-[#C6A15B] rounded-full px-3 py-1.5 shrink-0">Desk</Link>
      </div>
      {children}
    </div>
  );
}

export function rupee(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function plotTone(status: string) {
  if (status === 'SOLD') return 'bg-red-50 text-red-800 border-red-200';
  if (status === 'AGREEMENT') return 'bg-violet-50 text-violet-800 border-violet-200';
  if (status === 'BOOKED' || status === 'PENDING') return 'bg-sky-50 text-sky-800 border-sky-200';
  return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export async function uploadImage(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Image size must be less than 2 MB');
  }
  const body = new FormData();
  body.append('file', file);
  body.append('folder', 'bookings');
  const response = await api.post('/upload', body);
  return response.data?.url as string;
}

export function personName(row: any) {
  return row?.userId?.fullName || row?.fullName || row?.employeeCode || 'Agent';
}
