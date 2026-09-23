'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { sendOtp } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const router = useRouter();

  const clearRecaptcha = () => {
    if (typeof window !== 'undefined' && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Error clearing recaptcha:', e);
      }
      window.recaptchaVerifier = null;
    }
  };

  useEffect(() => {
    return () => clearRecaptcha();
  }, []);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const getRecaptchaVerifier = () => {
    if (!auth) throw new Error('Auth not initialized');
    clearRecaptcha();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-page', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => setError('reCAPTCHA expired. Please try again.'),
    });
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    const cleanPhone = phone.replace(/\D/g, '').trim();
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOtp(cleanPhone);
      const appVerifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
      setCountdown(30);
    } catch (err) {
      console.error('Failed to send OTP:', err);
      clearRecaptcha();
      let msg = 'Failed to send OTP. Please check your number.';
      if (err.code === 'auth/invalid-phone-number') msg = 'Invalid mobile number format.';
      else if (err.code === 'auth/operation-not-allowed') msg = 'SMS for India (+91) must be enabled in Firebase Console: Authentication > Settings > SMS region policy.';
      else if (err.code === 'auth/quota-exceeded') msg = 'SMS quota exceeded for today. You can still test with OTP 1234.';
      else if (err.code === 'auth/unauthorized-domain') msg = 'Domain not authorized in Firebase Console.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault?.();
    const cleanOtp = otp.trim();
    const cleanPhone = phone.replace(/\D/g, '').trim();

    if (!cleanOtp || (cleanOtp.length !== 6 && cleanOtp !== '1234')) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let firebaseToken = null;
      let firebaseUid = null;

      if (cleanOtp === '1234') {
        await login(cleanPhone, cleanOtp);
      } else if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(cleanOtp);
        firebaseToken = await userCredential.user.getIdToken();
        firebaseUid = userCredential.user.uid;
        await login(cleanPhone, cleanOtp, firebaseToken, firebaseUid);
      } else {
        await login(cleanPhone, cleanOtp);
      }

      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Invalid OTP. Please check the code and try again.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Incorrect 6-digit OTP.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;
      setError(msg);
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

        <div id="recaptcha-container-page"></div>
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
              disabled={loading || phone.length < 10}
              className="w-full bg-[#0C831F] hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center tracking-widest text-2xl font-bold focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition"
                placeholder="• • • • • •"
                autoFocus
              />
              <p className="text-[11px] text-gray-400 text-center mt-1.5">
                Enter the 6-digit code received via SMS
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || (otp.length !== 6 && otp !== '1234')}
              className="w-full bg-[#0C831F] hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setOtp('');
                  setConfirmationResult(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 transition"
              >
                Change Number
              </button>

              {countdown > 0 ? (
                <span className="text-xs text-gray-400 select-none">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-[#0C831F] hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
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
