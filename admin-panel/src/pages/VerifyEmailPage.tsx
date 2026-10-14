import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [message, setMessage] = useState<string>('Verifying your email address...');
  // Tokens are single-use: guard against StrictMode's double effect run, where the
  // second request fails and overwrites the success state with an error.
  const verifiedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage('Invalid verification link. No verification token was provided.');
      return;
    }
    if (verifiedTokenRef.current === token) return;
    verifiedTokenRef.current = token;

    const verify = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('SUCCESS');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('ERROR');
        setMessage(err.response?.data?.message || 'Invalid or expired verification token.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl border border-[#0B4F3C]/15 w-full max-w-md space-y-6 shadow-2xl text-center">
        {/* Header Logo */}
        <div className="space-y-2">
          <img
            src="/logo.png"
            alt="House & Sky — Building Trust. Delivering Value."
            className="h-16 w-auto max-w-full object-contain mx-auto"
          />
        </div>

        {/* Card Content */}
        <div className="py-6 space-y-4">
          {status === 'LOADING' && (
            <div className="space-y-3">
              <Loader2 className="w-12 h-12 text-[#0B4F3C] animate-spin mx-auto" />
              <p className="text-sm text-[#171A18]/70 font-semibold">{message}</p>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-bold text-[#171A18]">Email Verified!</h2>
              <p className="text-xs text-[#171A18]/70 leading-relaxed font-medium">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-200">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-lg font-bold text-[#171A18]">Verification Failed</h2>
              <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl bg-[#0B4F3C] hover:bg-[#063B2D] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Back to Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
