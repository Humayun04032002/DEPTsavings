import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; 
import { collection, onSnapshot, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Landmark, Percent, Calendar, User, Loader2, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAddLoan = () => {
  const navigate = useNavigate();
  const { userData } = useAuth(); 
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState({ total: 0, interest: 0, emi: 0 });
  
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    interestRate: '10', 
    duration: '12',      
  });

  // মেম্বার লিস্ট লোড করা
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "member"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // লোন ক্যালকুলেশন আপডেট (useEffect দিয়ে রিয়েল-টাইম করা হয়েছে)
  useEffect(() => {
    if (formData.amount && formData.interestRate && formData.duration) {
      const principal = Number(formData.amount);
      const interest = (principal * Number(formData.interestRate)) / 100;
      const total = principal + interest;
      const emi = total / Number(formData.duration);
      setCalculation({ total, interest, emi });
    }
  }, [formData]);

  const handleIssueLoan = async (e) => {
    e.preventDefault();
    if (!formData.userId) return alert("দয়া করে একজন মেম্বার সিলেক্ট করুন");
    if (Number(formData.amount) <= 0) return alert("লোনের পরিমাণ সঠিক নয়");
    
    setLoading(true);
    const selectedMember = members.find(m => m.id === formData.userId);

    try {
      // লোন ডাটা সেভ
      const loanDoc = await addDoc(collection(db, "loans"), {
        userId: formData.userId,
        memberName: selectedMember.name,
        memberPhone: selectedMember.phone,
        amount: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        duration: Number(formData.duration),
        totalPayable: calculation.total,
        monthlyInstallment: calculation.emi,
        remainingBalance: calculation.total,
        paidAmount: 0,
        status: 'approved',
        issuedBy: userData?.name || "Admin",
        createdAt: serverTimestamp()
      });

      // লগ আপডেট
      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Admin",
        action: "লোন ইস্যু",
        details: `${selectedMember.name}-কে ৳${formData.amount} লোন দেওয়া হয়েছে। মোট দেয়: ৳${calculation.total.toFixed(0)}`,
        timestamp: serverTimestamp(),
        type: "loan",
        loanId: loanDoc.id
      });

      alert("লোন সফলভাবে ইস্যু করা হয়েছে!");
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert("ভুল হয়েছে: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <button onClick={() => navigate('/admin')} className="group flex items-center gap-2 text-slate-500 mb-8 font-bold hover:text-purple-600 transition-all">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-purple-50 transition-colors">
            <ArrowLeft size={20} />
          </div>
          ড্যাশবোর্ড
        </button>

        <div className="bg-white p-6 md:p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 opacity-50" />
          
          <div className="relative">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                <Landmark size={30} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">নতুন লোন ইস্যু</h2>
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">Loan Issuance Portal</p>
              </div>
            </div>

            <form onSubmit={handleIssueLoan} className="space-y-6">
              {/* Member Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1 tracking-tighter">
                  <User size={12} className="text-purple-500"/> মেম্বার বাছাই করুন
                </label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all font-bold text-slate-700 appearance-none"
                  onChange={(e) => setFormData({...formData, userId: e.target.value})}
                >
                  <option value="">মেম্বার সিলেক্ট করুন</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                  ))}
                </select>
              </div>

              {/* Amount & Interest */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-tighter">পরিমাণ (৳)</label>
                  <div className="relative">
                    <input 
                      type="number" required placeholder="0.00" 
                      className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all font-black text-slate-800 text-lg" 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">BDT</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1 tracking-tighter">
                    <Percent size={12} className="text-purple-500"/> মুনাফার হার (%)
                  </label>
                  <input 
                    type="number" required 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all font-black text-slate-800 text-lg" 
                    value={formData.interestRate} 
                    onChange={(e) => setFormData({...formData, interestRate: e.target.value})} 
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1 tracking-tighter">
                  <Calendar size={12} className="text-purple-500"/> কিস্তির সময়সীমা
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['6', '12', '24'].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setFormData({...formData, duration: months})}
                      className={`p-4 rounded-2xl font-black transition-all border-2 ${formData.duration === months ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100' : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'}`}
                    >
                      {months} মাস
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Summary Card */}
              {formData.amount > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Landmark size={80} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোট আসল</p>
                      <p className="text-xl font-black">৳{formData.amount}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">মোট মুনাফা</p>
                      <p className="text-xl font-black">৳{calculation.interest.toFixed(0)}</p>
                    </div>
                    <div className="col-span-2 h-[1px] bg-slate-700 my-2" />
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">মোট পরিশোধযোগ্য</p>
                      <p className="text-2xl font-black">৳{calculation.total.toFixed(0)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">মাসিক কিস্তি</p>
                      <p className="text-2xl font-black text-orange-400 italic">৳{calculation.emi.toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings/Info */}
              <div className="flex gap-3 px-2">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                  লোন কনফার্ম করার আগে মেম্বারের তথ্য যাচাই করে নিন। লোন ইস্যু হওয়ার পর এটি মেম্বারের প্রোফাইলে সরাসরি দেখা যাবে।
                </p>
              </div>

              <button 
                type="submit"
                disabled={loading} 
                className="w-full bg-purple-600 text-white p-5 rounded-[1.5rem] font-black shadow-xl shadow-purple-100 flex justify-center items-center gap-3 hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 mt-4 uppercase tracking-widest text-sm"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={20}/> লোন নিশ্চিত করুন</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAddLoan;