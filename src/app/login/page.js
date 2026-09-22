'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const { login } = useAuth();
  const router = useRouter();

  const handleSendOtp = () => setStep(2);
  const handleVerify = async () => {
    try {
      const user = await login(phone, otp);
      if (user?.role === 'admin') router.push('/admin');
      else if (user?.role === 'delivery') router.push('/delivery');
      else router.push('/');
    } catch (e) {
      console.log('Dummy login for now');
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-[#0C831F] mb-6">Jyothi Mart</h1>
        {step === 1 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-[#0C831F]" placeholder="Enter 10 digit number" />
            <button onClick={handleSendOtp} className="w-full bg-[#0C831F] text-white font-bold py-3 rounded-xl">Send OTP</button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP sent to {phone}</label>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full border rounded-xl px-4 py-3 mb-4 text-center tracking-widest text-xl focus:outline-none focus:border-[#0C831F]" placeholder="1234" />
            <button onClick={handleVerify} className="w-full bg-[#0C831F] text-white font-bold py-3 rounded-xl">Verify & Login</button>
          </div>
        )}
      </div>
    </div>
  );
}
