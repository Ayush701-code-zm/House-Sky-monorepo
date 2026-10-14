import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Link2, Copy, Check, RefreshCw } from 'lucide-react';

interface InviteLinkCardProps {
  variant?: 'banner' | 'hero';
}

export const InviteLinkCard: React.FC<InviteLinkCardProps> = ({ variant = 'banner' }) => {
  const toast = useToast();
  const [inviteUrl, setInviteUrl] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const buildInviteUrl = (code: string) => `${window.location.origin}/join/${code}`;

  const loadInviteLink = async (showToast = false) => {
    setIsLoading(true);
    try {
      const res = await api.get('/employees/me/invite-link');
      const code = res.data?.inviteCode;
      if (!code) {
        if (showToast) toast.error('Could not load invite link');
        return;
      }
      setInviteUrl(buildInviteUrl(code));
      setEmployeeCode(res.data?.employeeCode || '');
      setSponsorName(res.data?.sponsorName || '');
      if (showToast) toast.success('Invite link refreshed');
    } catch (err: any) {
      toast.error(err?.friendlyMessage || 'Failed to load invite link');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInviteLink(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (variant === 'hero') {
    return (
      <div className="bg-white rounded-3xl border border-[#0B4F3C]/15 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B4F3C] to-[#063B2D] px-6 py-5 text-white">
          <p className="text-sm font-bold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#C9A96E]" />
            Your agent invite link
          </p>
          <p className="text-xs text-white/75 mt-1">
            Share this link. Jo isse join karega woh aapke downline mein add hoga.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {employeeCode ? (
            <p className="text-xs text-[#171A18]/70">
              Joining under: <span className="font-bold text-[#0B4F3C]">{sponsorName || 'You'}</span>
              {' · '}
              <span className="font-mono font-bold">{employeeCode}</span>
            </p>
          ) : null}
          <div className="bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-2xl px-4 py-3 min-h-[52px] flex items-center">
            {isLoading ? (
              <p className="text-xs text-[#171A18]/50">Loading your invite link…</p>
            ) : inviteUrl ? (
              <p className="text-sm font-mono break-all text-[#0B4F3C] font-bold">{inviteUrl}</p>
            ) : (
              <p className="text-xs text-red-700">Invite link could not be loaded. Refresh and try again.</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!inviteUrl}
              className="px-4 py-2.5 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy invite link'}
            </button>
            <button
              type="button"
              onClick={() => loadInviteLink(true)}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-[#0B4F3C]/20 bg-[#E8F0EC] text-[#0B4F3C] text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-2xl border border-[#0B4F3C]/15 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#171A18] flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#0B4F3C]" />
          Invite an agent under you
        </p>
        <p className="text-[11px] text-[#171A18]/60 mt-0.5">
          Share this link. New agents who join with it are added in your downline.
        </p>
        <p className="mt-2 text-[11px] font-mono break-all text-[#0B4F3C] bg-[#E8F0EC] rounded-lg px-2 py-1.5 min-h-[32px]">
          {isLoading ? 'Loading invite link…' : inviteUrl || 'Invite link unavailable'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!inviteUrl}
          className="px-3.5 py-2 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={() => loadInviteLink(true)}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-xl border border-[#0B4F3C]/20 bg-[#E8F0EC] text-[#0B4F3C] text-xs font-bold"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};
