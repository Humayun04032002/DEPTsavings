import React, { useState, useEffect } from 'react';
import { 
  Wallet, X, CheckCircle2, Megaphone, History, 
  Zap, ChevronRight, Plus, Copy
} from 'lucide-react';
import { db, auth } from '../firebase/config';
import { 
  collection, query, where, onSnapshot, addDoc, 
  serverTimestamp, doc, limit, orderBy 
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const HomeTab = ({ user, darkMode }) => {
  const navigate = useNavigate();
  const [showPayModal, setShowPayModal] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [latestNotice, setLatestNotice] = useState(null);
  
  // State for admin payment numbers
  const [paySettings, setPaySettings] = useState({ bkash: 'Loading...', nagad: 'Loading...' }); 
  const [hasPaidThisMonth, setHasPaidThisMonth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState('');
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = months[new Date().getMonth()];

  const [payInfo, setPayInfo] = useState({ 
    amount: user?.monthlyTarget || '', 
    method: 'Bkash', 
    trxId: '',
    forMonth: currentMonthName 
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    // ১. পেমেন্ট নাম্বার ফেচ (Admin settings -> pay_settings document)
    const unsubPaySettings = onSnapshot(doc(db, "settings", "pay_settings"), (d) => {
      if(d.exists()) {
        const data = d.data();
        setPaySettings({
          bkash: data.bkash || 'Not Set',
          nagad: data.nagad || 'Not Set'
        });
      }
    }, (err) => {
        console.error("Payment Settings Error:", err);
    });

    // ২. ট্রানজ্যাকশন হিস্টোরি এবং পেমেন্ট স্ট্যাটাস চেক
    const q = query(collection(db, "deposits"), where("userId", "==", auth.currentUser.uid));
    const unsubDeposits = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sortedDocs = docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setDeposits(sortedDocs);

      const now = new Date();
      const paid = sortedDocs.some(d => {
        if (!d.timestamp || !d.forMonth) return false;
        // Check if current month is paid and not rejected
        return d.forMonth === currentMonthName && (d.status === 'approved' || d.status === 'pending');
      });
      setHasPaidThisMonth(paid);
    });

    // ৩. সর্বশেষ নোটিশ ফেচ
    const noticeQ = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(1));
    const unsubNotice = onSnapshot(noticeQ, (snap) => {
      if(!snap.empty) setLatestNotice({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });

    return () => { 
      unsubDeposits(); 
      unsubPaySettings(); 
      unsubNotice(); 
    };
  }, [user, currentMonthName]);

  const copyToClipboard = (text, type) => {
    if(!text || text.includes('Loading')) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if(!payInfo.amount || !payInfo.trxId) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "deposits"), {
        userId: auth.currentUser.uid,
        userName: user?.name || "Member",
        regNo: user?.regNo || "N/A",
        amount: Number(payInfo.amount),
        method: payInfo.method,
        trxId: payInfo.trxId.toUpperCase().trim(),
        forMonth: payInfo.forMonth,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setShowPayModal(false);
      setPayInfo(prev => ({ ...prev, trxId: '' }));
      alert("আপনার জমার অনুরোধটি সফলভাবে পাঠানো হয়েছে!");
    } catch (err) { 
      alert("Error: " + err.message); 
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`space-y-6 pb-24 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Notice Bar */}
      {latestNotice && (
        <div onClick={() => navigate('/notices')} className={`glass-card p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer border-l-4 border-orange-400 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white shadow-sm'}`}>
          <div className="bg-orange-500/10 p-3 rounded-2xl text-orange-500"><Megaphone size={20} className="animate-bounce" /></div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-[10px] font-black uppercase opacity-50 tracking-widest">Notice</h4>
            <p className={`text-xs font-bold truncate ${darkMode ? 'text-white/80' : 'text-slate-700'}`}>{latestNotice.message}</p>
          </div>
          <ChevronRight size={18} className="opacity-30" />
        </div>
      )}

      {/* Hero Status Card */}
      <div className={`relative p-8 rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700
        ${hasPaidThisMonth ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-950/40'} text-white`}>
        
        <button 
          onClick={() => setShowPayModal(true)} 
          className="absolute right-0 top-0 p-8 active:scale-90 transition-transform z-30"
        >
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 transition-all">
            <Plus size={28} strokeWidth={3} />
          </div>
        </button>

        <div className="relative z-10 flex flex-col items-center text-center py-4">
          <div className={`mb-4 p-5 rounded-full backdrop-blur-md ${hasPaidThisMonth ? 'bg-white/20' : 'bg-orange-500/20'}`}>
            {hasPaidThisMonth ? <CheckCircle2 size={48}/> : <Zap size={48} className="text-orange-400 animate-pulse"/>}
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter mb-1 uppercase">
            {hasPaidThisMonth ? 'Paid' : 'Unpaid'}
          </h2>
          <p className="text-sm font-medium opacity-70 mb-8 max-w-[200px]">
            {hasPaidThisMonth ? `আপনার ${currentMonthName} মাসের কিস্তি জমা হয়েছে` : `${currentMonthName} মাসের কিস্তি এখনো জমা দেওয়া হয়নি`}
          </p>
          {!hasPaidThisMonth && (
            <button onClick={() => setShowPayModal(true)} className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm shadow-xl flex justify-center items-center gap-2 active:scale-95 transition-all">
              <Wallet size={20} /> Deposit Now
            </button>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-7 rounded-[2.5rem] ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Total Savings</p>
          <p className="text-2xl font-black italic">৳{Number(user?.totalSavings || 0).toLocaleString()}</p>
        </div>
        <div className={`p-7 rounded-[2.5rem] ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">Monthly Target</p>
          <p className="text-2xl font-black italic">৳{Number(user?.monthlyTarget || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Recent History */}
      <div className={`p-7 rounded-[2.5rem] ${darkMode ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm border border-slate-100'}`}>
        <h3 className="font-black text-[10px] uppercase flex items-center gap-2 opacity-40 mb-5 tracking-widest text-blue-500"><History size={16}/> Recent Transactions</h3>
        <div className="space-y-4">
          {deposits.slice(0, 3).map(d => (
            <div key={d.id} className={`p-5 rounded-[2rem] flex items-center justify-between ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div>
                <p className="text-lg font-black italic">৳{Number(d.amount).toLocaleString()}</p>
                <p className="text-[10px] font-bold opacity-40 uppercase">{d.forMonth} • {d.method}</p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase 
                ${d.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' : 
                  d.status === 'rejected' ? 'bg-rose-500/20 text-rose-500' : 'bg-orange-500/20 text-orange-500'}`}>
                {d.status}
              </div>
            </div>
          ))}
          {deposits.length === 0 && <p className="text-center text-xs opacity-40 py-4 font-bold uppercase tracking-widest">No history yet</p>}
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-[3.5rem] p-8 shadow-2xl max-h-[92vh] overflow-y-auto border border-white/10 animate-in slide-in-from-bottom-20 duration-500 ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase text-blue-500">Deposit</h3>
              <button onClick={() => setShowPayModal(false)} className="p-3 bg-rose-500/10 rounded-full text-rose-500 active:scale-90"><X size={24}/></button>
            </div>

            {/* Admin Numbers Section */}
            <div className="space-y-4 mb-8">
              {/* BKASH CARD */}
              <div className={`p-5 rounded-3xl flex items-center justify-between border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-pink-50 border-pink-100'}`}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#e2136e] rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg">BK</div>
                   <div>
                     <p className={`text-[10px] font-black opacity-50 uppercase ${darkMode ? 'text-pink-300' : 'text-pink-600'}`}>Bkash Personal</p>
                     <p className="text-lg font-black tracking-widest">{paySettings.bkash}</p>
                   </div>
                </div>
                <button onClick={() => copyToClipboard(paySettings.bkash, 'bkash')} className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white shadow-sm hover:shadow-md'}`}>
                  {copied === 'bkash' ? <CheckCircle2 size={20} className="text-emerald-500"/> : <Copy size={20} className="opacity-40"/>}
                </button>
              </div>

              {/* NAGAD CARD */}
              <div className={`p-5 rounded-3xl flex items-center justify-between border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-orange-50 border-orange-100'}`}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-[#f7941d] rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg">NG</div>
                   <div>
                     <p className={`text-[10px] font-black opacity-50 uppercase ${darkMode ? 'text-orange-300' : 'text-orange-600'}`}>Nagad Personal</p>
                     <p className="text-lg font-black tracking-widest">{paySettings.nagad}</p>
                   </div>
                </div>
                <button onClick={() => copyToClipboard(paySettings.nagad, 'nagad')} className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white shadow-sm hover:shadow-md'}`}>
                  {copied === 'nagad' ? <CheckCircle2 size={20} className="text-emerald-500"/> : <Copy size={20} className="opacity-40"/>}
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleDepositSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-2">Month</label>
                  <select 
                    className={`w-full p-5 rounded-3xl outline-none font-black text-xs appearance-none border-2 border-transparent focus:border-blue-500/50 ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
                    value={payInfo.forMonth}
                    onChange={(e) => setPayInfo({...payInfo, forMonth: e.target.value})}
                  >
                    {months.map(m => <option key={m} value={m} className="text-black">{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-2">Method</label>
                  <select 
                    className={`w-full p-5 rounded-3xl outline-none font-black text-xs appearance-none border-2 border-transparent focus:border-blue-500/50 ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
                    value={payInfo.method}
                    onChange={(e) => setPayInfo({...payInfo, method: e.target.value})}
                  >
                    <option value="Bkash" className="text-black">Bkash</option>
                    <option value="Nagad" className="text-black">Nagad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-2">Amount (৳)</label>
                <input type="number" className={`w-full p-5 rounded-3xl outline-none font-black text-xl border-2 border-transparent focus:border-blue-500/50 ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`} value={payInfo.amount} onChange={(e) => setPayInfo({...payInfo, amount: e.target.value})} required />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black opacity-40 uppercase tracking-widest ml-2">TrxID</label>
                <input type="text" placeholder="EX: 9XN8..." className={`w-full p-5 rounded-3xl outline-none font-black text-lg uppercase border-2 border-transparent focus:border-blue-500/50 ${darkMode ? 'bg-white/5 text-white placeholder:opacity-20' : 'bg-slate-100 text-slate-900'}`} value={payInfo.trxId} onChange={(e) => setPayInfo({...payInfo, trxId: e.target.value})} required />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-6 mt-4 rounded-[2.5rem] bg-blue-600 text-white font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs">
                {isSubmitting ? 'Processing...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeTab;