import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { 
  ArrowLeft, History, Loader2, Calendar, Hash, 
  Bookmark, UserCheck, CreditCard, Sparkles 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransactionHistory = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // সরাসরি লোকাল স্টোরেজ থেকে ডার্ক মোড চেক করা
  const [darkMode] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // ডার্ক মোড বডি ক্লাস আপডেট
    if (darkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    if (!auth.currentUser) return;

    setLoading(true);

    const q = query(
      collection(db, "deposits"), 
      where("userId", "==", auth.currentUser.uid)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const sorted = docs.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setDeposits(sorted);
      setLoading(false);
    }, (error) => {
      console.error("Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-all duration-700 font-sans ${
      darkMode ? 'bg-[#020617] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      
      {/* ১. স্টিকি গ্লসি হেডার */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${
        darkMode ? 'bg-[#020617]/80 border-white/10' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-xl mx-auto px-6 py-6">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-3 rounded-2xl transition-all active:scale-90 border mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                darkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
            }`}
          >
            <ArrowLeft size={16} /> ফিরে যান
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-[1.5rem] text-white shadow-2xl ${
                darkMode ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-indigo-500 shadow-indigo-500/20'
              }`}>
                <History size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                    লেনদেন লেজার <Sparkles size={16} className="text-amber-500" />
                </h2>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Financial Statement</p>
              </div>
            </div>
            
            <div className={`px-4 py-2 rounded-2xl border ${
              darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
               <p className="text-[8px] font-black opacity-40 uppercase text-center">এন্ট্রি</p>
               <p className="text-sm font-black text-center text-indigo-500">{deposits.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 animate-pulse">
            <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
            <p className="font-black uppercase tracking-[0.3em] text-[10px] opacity-30">লোড হচ্ছে...</p>
          </div>
        ) : deposits.length > 0 ? (
          deposits.map((d, idx) => (
            <div 
              key={d.id} 
              className={`group p-6 rounded-[2.8rem] border-2 transition-all duration-500 animate-in ${
                darkMode 
                ? 'bg-slate-900/40 border-white/5 hover:border-indigo-500/30' 
                : 'bg-white border-white shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10'
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-[1.4rem] flex items-center justify-center font-black text-2xl transition-all shadow-inner ${
                    d.status === 'approved' 
                    ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') 
                    : (darkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')
                  }`}>
                    ৳
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                       <p className={`text-2xl font-black italic tracking-tighter ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {Number(d.amount).toLocaleString('bn-BD')}
                      </p>
                      {d.month && (
                        <div className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase flex items-center gap-1 ${
                          darkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                        }`}>
                          <Bookmark size={10} className="fill-current"/> {d.month}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-40 mt-1">
                      <Calendar size={12} />
                      <p className="text-[9px] font-black uppercase tracking-tighter">
                         {d.timestamp?.toDate ? d.timestamp.toDate().toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                  d.status === 'approved' 
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' 
                  : (darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm')
                }`}>
                  {d.status === 'approved' ? 'সফল' : 'পেন্ডিং'}
                </span>
              </div>

              {/* কার্ড ফুটার */}
              <div className={`pt-5 border-t border-dashed flex items-center justify-between transition-all ${
                darkMode ? 'border-white/10' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  {d.method === "Cash (Admin)" ? (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                      darkMode ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                      <UserCheck size={14} />
                      <p className="text-[9px] font-black uppercase tracking-wider">
                        BY: {d.collectedBy || 'অ্যাডমিন'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 opacity-30">
                      <Hash size={12} />
                      <p className="text-[9px] font-black uppercase tracking-wider">
                        TrxID: <span className="tracking-normal ml-1">{d.trxId || 'N/A'}</span>
                      </p>
                    </div>
                  )}
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                  darkMode ? 'bg-white/5 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}>
                  <CreditCard size={12} className="opacity-40" />
                  {d.method === "Cash (Admin)" ? "Cash" : d.method}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-40 space-y-4 opacity-20">
            <History size={80} strokeWidth={1} />
            <p className="font-black italic text-xl uppercase tracking-widest text-center">কোনো লেনদেন পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-in {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TransactionHistory;