'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, Phone, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSendOtp = (e) => {
    e?.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(phone.trim(), otp.trim());
      // Always redirect to customer view as requested
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try test OTP 1234.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#0C831F] border border-green-200 flex items-center justify-center mx-auto mb-3 font-extrabold text-xl">
            JM
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Jyothi Mart</h1>
          <p className="text-xs text-gray-500 mt-1">
            {step === 1 ? 'Enter your mobile number to sign in' : `Enter OTP sent to +91 ${phone}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-3.5 py-2.5 rounded-xl border border-red-200 mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition"
                  placeholder="9876543210"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0C831F] hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                One-Time Password
              </label>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center tracking-widest text-2xl font-bold focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition"
                placeholder="1234"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0C831F] hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Enter Store</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError('');
              }}
              className="w-full text-xs text-gray-500 hover:text-gray-800 text-center py-1 transition"
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-[11px] text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0C831F]" />
            <span>Admin Test: <strong>1234567890</strong> (OTP 1234)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
