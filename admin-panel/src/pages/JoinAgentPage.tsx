import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { UserPlus } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 6;

export const JoinAgentPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const inviteCode = String(code || '').trim().toUpperCase();
  const [sponsorName, setSponsorName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [isLoadingSponsor, setIsLoadingSponsor] = useState(true);
  const [sponsorError, setSponsorError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!inviteCode) {
        setSponsorError('Invite code is missing.');
        setIsLoadingSponsor(false);
        return;
      }
      try {
        const res = await api.get(`/public/agent-invite/${inviteCode}`);
        setSponsorName(res.data?.sponsorName || '');
        setEmployeeCode(res.data?.employeeCode || '');
      } catch (err: any) {
        setSponsorError(err?.response?.data?.message || 'This invite link is invalid.');
      } finally {
        setIsLoadingSponsor(false);
      }
    };
    load();
  }, [inviteCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/public/agent-application', {
        fullName,
        email,
        phone,
        password,
        inviteCode
      });
      setSuccess(res.data?.message || 'Account created. Wait for admin approval, then login.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-[#0B4F3C]/15 w-full max-w-md space-y-5 shadow-2xl">
        <div className="text-center space-y-2">
          <img
            src="/logo.png"
            alt="House & Sky — Building Trust. Delivering Value."
            className="h-14 w-auto max-w-full object-contain mx-auto"
          />
          <h1 className="text-2xl font-serif font-bold text-[#171A18]">Join as an Agent</h1>
          {sponsorName ? (
            <p className="text-xs text-[#171A18]/70">
              You will join under <span className="font-bold text-[#0B4F3C]">{sponsorName}</span>
              {employeeCode ? ` (${employeeCode})` : ''}
            </p>
          ) : (
            <p className="text-xs text-[#171A18]/70">Create your House & Sky agent account</p>
          )}
        </div>

        {isLoadingSponsor ? (
          <p className="text-xs text-center text-[#171A18]/60">Checking invite link…</p>
        ) : sponsorError ? (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-red-700">{sponsorError}</p>
            <Link to="/login" className="text-xs font-bold text-[#0B4F3C] underline">Back to login</Link>
          </div>
        ) : success ? (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-emerald-800">{success}</p>
            <Link to="/login" className="inline-flex px-4 py-2 rounded-xl bg-[#0B4F3C] text-white text-xs font-bold">
              Go to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <label className="block space-y-1">
              <span className="font-bold text-[#171A18]/70">Full name</span>
              <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#0B4F3C]" />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-[#171A18]/70">Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#0B4F3C]" />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-[#171A18]/70">Phone</span>
              <input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#0B4F3C]" />
            </label>
            <label className="block space-y-1">
              <span className="font-bold text-[#171A18]/70">Password</span>
              <input required type="password" minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-[#0B4F3C]" />
            </label>
            {error ? <p className="text-red-600 font-semibold">{error}</p> : null}
            <button type="submit" disabled={isSubmitting} className="w-full py-2.5 rounded-xl bg-[#0B4F3C] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Creating account…' : 'Create agent account'}
            </button>
            <p className="text-center text-[#171A18]/50">
              Already have an account? <Link to="/login" className="font-bold text-[#0B4F3C]">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
