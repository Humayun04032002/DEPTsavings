import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  User, Phone, Lock, Users, CreditCard, Hash, 
  Banknote, Send, GraduationCap, Sparkles, CheckCircle2 
} from 'lucide-react';

const RegisterLink = () => {
  const [formData, setFormData] = useState({
    name: '', phone: '', fatherName: '', nid: '', regNo: '', monthlyTarget: '', password: ''
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // রেজিস্ট্রেশন নম্বর ৬ ডিজিট কি না চেক করা (নিরাপত্তার জন্য)
    if (formData.regNo.length !== 6) {
      alert("রেজিস্ট্রেশন নম্বরের শেষ ৬ ডিজিট সঠিকভাবে লিখুন।");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "memberRequests"), {
        ...formData,
        email: `${formData.phone}@somity.com`,
        status: "pending",
        createdAt: serverTimestamp()
      });
      setSent(true);
    } catch (err) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-6 text-center">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl max-w-md border border-emerald-50 animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-emerald-200">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 leading-tight">আবেদন সফল!</h2>
        <p className="text-slate-500 mt-4 font-bold leading-relaxed">
          আপনার তথ্যটি আমাদের ডেটাবেসে জমা হয়েছে। অ্যাডমিন যাচাই করে এপ্রুভ করলেই আপনি লগইন করতে পারবেন।
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 relative overflow-hidden font-sans">
      
      {/* ব্যাকগ্রাউন্ড ডেকোরেশন */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-blue-400/10 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-emerald-400/10 z-0"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* প্রিমিয়াম হেডার সেকশন */}
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-xl border border-slate-50 mb-2 text-blue-600 animate-bounce-slow">
            <GraduationCap size={42} />
          </div>
          <h2 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Member Registration</h2>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
            সরকারি শাহ সুলতান কলেজ, বগুড়া
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-md font-bold text-slate-500 italic">Department of Botany</p>
            <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-full tracking-widest uppercase">
                Student Savings System
                </span>
                <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-full tracking-widest uppercase">
                Session: 2022-2023
                </span>
            </div>
          </div>
        </div>

        {/* রেজিস্ট্রেশন ফর্ম কার্ড */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-white p-8 md:p-12">
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">নতুন সদস্য ফরম</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">নিচের তথ্যগুলো সঠিক ভাবে পূরণ করুন</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
            
            <InputField 
              label="আপনার পূর্ণ নাম" 
              placeholder="উদা: আব্দুল্লাহ আল মামুন"
              icon={<User size={18}/>}
              helpText="আপনার সার্টিফিকেটের নাম অনুযায়ী ইংরেজিতে বা বাংলায় লিখুন।"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <InputField 
              label="পিতার নাম" 
              placeholder="পিতার পূর্ণ নাম"
              icon={<Users size={18}/>}
              helpText="আপনার পিতার পূর্ণ নাম এখানে প্রদান করুন।"
              onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
            />

            <InputField 
              label="মোবাইল নম্বর" 
              type="number"
              placeholder="017XXXXXXXX"
              icon={<Phone size={18}/>}
              helpText="লগইন করার সময় এই নম্বরটি প্রয়োজন হবে।"
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />

            {/* আপডেট করা রেজিস্ট্রেশন নম্বর ইনপুট */}
            <InputField 
              label="রেজিস্ট্রেশন শেষ ৬ ডিজিট" 
              placeholder="শেষ ৬টি সংখ্যা লিখুন"
              type="number"
              maxLength="6"
              icon={<Hash size={18}/>}
              helpText="আপনার কলেজ রেজিস্ট্রেশন কার্ডের শেষ ৬টি ডিজিট এখানে লিখুন।"
              onChange={(e) => {
                const val = e.target.value;
                if(val.length <= 6) setFormData({...formData, regNo: val});
              }}
              value={formData.regNo}
            />

            <InputField 
              label="এনআইডি নম্বর (ঐচ্ছিক)" 
              placeholder="NID / জন্ম নিবন্ধন নম্বর"
              icon={<CreditCard size={18}/>}
              helpText="আপনার জাতীয় পরিচয়পত্র অথবা জন্ম নিবন্ধন নম্বর দিন।"
              onChange={(e) => setFormData({...formData, nid: e.target.value})}
            />

            <InputField 
              label="মাসিক জমার লক্ষ্য (৳)" 
              type="number"
              placeholder="উদা: ৫০০"
              icon={<Banknote size={18}/>}
              helpText="প্রতি মাসে আপনি কত টাকা জমা দিতে ইচ্ছুক তা লিখুন।"
              onChange={(e) => setFormData({...formData, monthlyTarget: e.target.value})}
            />

            <div className="md:col-span-2">
              <InputField 
                label="লগইন পাসওয়ার্ড সেট করুন" 
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18}/>}
                helpText="পাসওয়ার্ডটি মনে রাখবেন, পরবর্তীতে লগইন করতে এটি প্রয়োজন হবে।"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`md:col-span-2 py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] text-white transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 ${
                loading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-slate-900 hover:to-slate-800'
              }`}
            >
              {loading ? 'প্রসেসিং হচ্ছে...' : (
                <>আবেদন সম্পন্ন করুন <Send size={18} /></>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
          Official Botanical Society Application Portal
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

const InputField = ({ label, icon, helpText, ...props }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 group-focus-within:text-blue-600 transition-colors">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
        {icon}
      </div>
      <input 
        required
        {...props}
        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500/10 focus:bg-white rounded-[1.8rem] outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-inner"
      />
    </div>
    <p className="text-[9px] font-bold text-slate-400 italic ml-4 opacity-70">
      * {helpText}
    </p>
  </div>
);

export default RegisterLink;