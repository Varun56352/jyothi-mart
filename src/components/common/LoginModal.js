'use client';
import { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2, Phone, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sendOtp } from '@/lib/api';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();

  const [step, setStep] = useState(1); // 1 = phone, 2 = otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  // Reset state whenever modal opens or closes
  useEffect(() => {
    if (isLoginModalOpen) {
      setStep(1);
      setPhone('');
      setOtp('');
      setError('');
      setLoading(false);
      setIsNewUser(false);
    }
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').trim();

    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await sendOtp(cleanPhone);
      const data = res.data || {};
      setIsNewUser(Boolean(data.isNewUser));
      setStep(2);
    } catch (err) {
      console.error('Failed to send OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(phone.replace(/\D/g, '').trim(), cleanOtp);
      closeLoginModal();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid OTP. Please enter test OTP 1234.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={closeLoginModal} />

      {/* Modal Dialog */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 z-10 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Mobile Number Input */}
        {step === 1 ? (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#0C831F] border border-green-200 flex items-center justify-center mx-auto mb-3 font-extrabold text-xl shadow-2xs">
                JM
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Welcome to Jyothi Mart
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Enter your mobile number to sign in or get started
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3.5 py-2.5 rounded-xl border border-red-200 mb-4 animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-bold text-gray-600 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full border border-gray-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold tracking-wide focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition"
                    placeholder="9876543210"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-[#0C831F] hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-[10px] text-gray-400 text-center mt-5 leading-relaxed">
              By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        ) : (
          /* Step 2: OTP Verification */
          <div>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-[#0C831F] border border-green-200 flex items-center justify-center mx-auto mb-3 font-extrabold text-xl shadow-2xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Enter Verification Code
              </h3>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-gray-500">
                <span>We sent an OTP to</span>
                <span className="font-bold text-gray-800">+91 {phone}</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  className="text-[#0C831F] font-bold hover:underline cursor-pointer ml-1"
                >
                  Edit
                </button>
              </div>
            </div>

            {isNewUser && (
              <div className="bg-emerald-50 text-emerald-800 text-xs px-3.5 py-2 rounded-xl border border-emerald-200 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0C831F] flex-shrink-0" />
                <span>Welcome! We're creating your Jyothi Mart account.</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3.5 py-2.5 rounded-xl border border-red-200 mb-4 animate-in fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  4-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-200 rounded-2xl py-3 text-center text-xl font-black tracking-widest focus:outline-none focus:border-[#0C831F] focus:ring-2 focus:ring-[#0C831F]/20 transition"
                  placeholder="• • • •"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 text-center mt-1.5">
                  Test OTP: <strong className="text-gray-700 font-bold">1234</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-[#0C831F] hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Verify & Proceed</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
