import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, UserCheck, Briefcase, X, Send, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'AGENT' | 'MANAGER'>('ADMIN');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);


  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string>('');


  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [isSendingForgot, setIsSendingForgot] = useState<boolean>(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: 'ADMIN' | 'AGENT' | 'MANAGER') => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      setUnverifiedEmail(null);
      setResendMessage('');

      const response = await api.post('/auth/login', { email, password });
      const { token, user, employee } = response.data;

      // Property owners / public users have their own portal on the website.
      if (['PROPERTY_OWNER', 'USER'].includes(user.role)) {
        setError('This panel is for staff and agents only. Property owners should log in on the House & Sky website.');
        return;
      }

      login(token, user, employee);
      const isAdmin = ['ADMIN', 'DIRECTOR'].includes(user.role);
      navigate(isAdmin ? '/dashboard' : '/agent');
    } catch (err: any) {
      console.error(err);
      const responseData = err.response?.data;
      if (responseData && responseData.isVerified === false) {
        setUnverifiedEmail(responseData.email || email);
        setError(responseData.message || 'Your email address is not verified yet.');
      } else {
        setError(err.friendlyMessage || responseData?.message || 'Invalid authentication credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail && !email) return;
    try {
      setIsResending(true);
      setResendMessage('');
      const response = await api.post('/auth/resend-verification', {
        email: unverifiedEmail || email
      });
      setResendMessage(response.data.message || 'Verification link sent! Check your inbox.');
    } catch (err: any) {
      setResendMessage(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      setIsSendingForgot(true);
      setForgotFeedback(null);
      const response = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotFeedback({
        type: 'success',
        msg: response.data.message || 'Password reset link sent to your email!'
      });
    } catch (err: any) {
      setForgotFeedback({
        type: 'error',
        msg: err.response?.data?.message || 'Failed to send password reset email.'
      });
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-[#0B4F3C]/15 w-full max-w-md space-y-6 shadow-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <img
            src="/logo.png"
            alt="House & Sky — Building Trust. Delivering Value."
            className="h-16 w-auto max-w-full object-contain mx-auto"
          />
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#E8F0EC] rounded-xl border border-[#0B4F3C]/15">
          <button
            type="button"
            onClick={() => handleRoleSelect('ADMIN')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${selectedRole === 'ADMIN'
                ? 'bg-[#0B4F3C] text-white shadow-md'
                : 'text-[#171A18]/70 hover:text-[#0B4F3C]'
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('AGENT')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${selectedRole === 'AGENT'
                ? 'bg-[#0B4F3C] text-white shadow-md'
                : 'text-[#171A18]/70 hover:text-[#0B4F3C]'
              }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Agent</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSelect('MANAGER')}
            className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${selectedRole === 'MANAGER'
                ? 'bg-[#0B4F3C] text-white shadow-md'
                : 'text-[#171A18]/70 hover:text-[#0B4F3C]'
              }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Manager</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs font-semibold space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
            {unverifiedEmail && (
              <div className="pt-2 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isResending ? 'Sending Verification Email...' : 'Resend Verification Email'}
                </button>
                {resendMessage && (
                  <p className="mt-2 text-[11px] font-bold text-[#0B4F3C] text-center bg-white p-2 rounded-lg border border-[#0B4F3C]/20">
                    {resendMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[#171A18]/70 font-semibold">Member ID, email, or mobile</label>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#171A18]/50" />
              <input
                type="text"
                required
                placeholder="H&S-1004, email, or mobile"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#171A18] placeholder-[#171A18]/50 focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#171A18]/70 font-semibold">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotFeedback(null);
                  setShowForgotModal(true);
                }}
                className="text-[11px] font-bold text-[#0B4F3C] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#171A18]/50" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#171A18] placeholder-[#171A18]/50 focus:outline-none focus:border-[#0B4F3C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center cursor-pointer border border-[#0B4F3C] disabled:opacity-60"
          >
            {isLoading ? 'Authenticating...' : `Sign In as ${selectedRole}`}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#0B4F3C]/20 shadow-2xl p-6 w-full max-w-sm space-y-4 relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-[#171A18]/40 hover:text-[#171A18] hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-[#171A18]">Reset Password</h3>
              <p className="text-xs text-[#171A18]/60">
                Enter your registered email address to receive password reset instructions.
              </p>
            </div>

            {forgotFeedback?.type === 'success' ? (
              <div className="py-4 space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                  <Send className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-[#171A18] text-sm">Reset Link Sent!</h4>
                  <p className="text-xs text-[#171A18]/70 font-medium">
                    {forgotFeedback.msg}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotFeedback(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                {forgotFeedback && (
                  <div className="p-3 rounded-xl text-xs font-bold text-center border bg-red-50 text-red-600 border-red-200">
                    {forgotFeedback.msg}
                  </div>
                )}

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs text-[#171A18]/70 font-semibold block mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#171A18]/50" />
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-[#FDFCF0] border border-[#0B4F3C]/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#171A18] focus:outline-none focus:border-[#0B4F3C]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="w-1/2 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingForgot}
                      className="w-1/2 py-2.5 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSendingForgot ? 'Sending...' : 'Send Link'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
