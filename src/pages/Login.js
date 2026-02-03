import React, { useState } from 'react';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Loader2, Sparkles, GraduationCap } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = `${phone}@somity.com`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🟢 অ্যান্ড্রয়েড অ্যাপকে জানানো যে এই ইউজার (সাগর বা রাকিব) লগইন করেছেন
      // এটি করলে শুধুমাত্র সঠিক ইউজারের ফোনেই নোটিফিকেশন যাবে
      if (window.Android) {
        window.Android.setCurrentUser(user.uid);
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError("ফোন নম্বর বা পাসওয়ার্ড ভুল হয়েছে!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 relative overflow-hidden font-sans">
      
      {/* ১. প্রিমিয়াম ব্যাকগ্রাউন্ড আর্ট ও টেক্সচার */}
      <div className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}>
      </div>
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-emerald-400/20 z-0"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] bg-blue-400/20 z-0"></div>

      <div className="max-w-md w-full relative z-10">
        {/* কলেজ ও ডিপার্টমেন্টের নাম (প্রিমিয়াম হেডার) */}
        <div className="text-center mb-10 space-y-2 animate-fadeIn">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-xl border border-slate-100 mb-4 text-emerald-600">
            <GraduationCap size={40} />
          </div>
          <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Student Savings System</h2>
          <h1 className="text-2xl font-black text-slate-900 leading-tight">
            সরকারি শাহ সুলতান কলেজ, বগুড়া
          </h1>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-slate-500 italic">Department of Botany</p>
            <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-full tracking-widest uppercase">
              Session: 2022-2023
            </span>
          </div>
        </div>

        {/* লগইন কার্ড (Glassmorphism) */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white p-8 md:p-10 relative overflow-hidden">
          {/* Card Decoration */}
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12">
            <Sparkles size={100} />
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-black text-center uppercase tracking-wider animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ফোন নম্বর</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  type="number"
                  placeholder="017XXXXXXXX"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[1.8rem] outline-none transition-all font-black text-slate-700 placeholder:text-slate-300 shadow-inner"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">গোপন পাসওয়ার্ড</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-[1.8rem] outline-none transition-all font-black text-slate-700 placeholder:text-slate-300 shadow-inner"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${
                loading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:shadow-emerald-500/20 hover:from-emerald-600 hover:to-emerald-500'
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'লগইন সম্পন্ন করুন'
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-50 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              পাসওয়ার্ড ভুলে গেলে বা কোনো সমস্যার জন্য <br/>
              <span className="text-emerald-600">অ্যাডমিনের সাথে যোগাযোগ করুন।</span>
            </p>
          </div>
        </div>

        {/* Footer Credit */}
        <p className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Secure Botanical Savings Portal
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};

export default Login;