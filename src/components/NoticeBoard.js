import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, where, writeBatch, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Megaphone, Clock, Calendar, Bell, 
  CheckCircle2, XCircle, Sparkles, Send
} from 'lucide-react';

const NoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [personalNotifs, setPersonalNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // সরাসরি লোকাল স্টোরেজ থেকে থিম রিড করা
  const [darkMode] = useState(localStorage.getItem('theme') === 'dark');

  // --- অ্যান্ডরয়েড পুশ নোটিফিকেশন লজিক ---
  const triggerPushNotification = (title, body) => {
    if (window.Android && window.Android.showNotification) {
      window.Android.showNotification(title, body);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!auth.currentUser) return;

    // ১. জেনারেল নোটিশ লিসেনার
    const qNotice = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubNotice = onSnapshot(qNotice, (snap) => {
      const newNotices = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // নতুন নোটিশ আসলে নোটিফিকেশন দেখানো (প্রথমবার লোড বাদে)
      if (!loading && newNotices.length > notices.length) {
        const latest = newNotices[0];
        triggerPushNotification(latest.title || "নতুন নোটিশ", latest.message);
      }
      
      setNotices(newNotices);
      if(loading) setLoading(false);
    });

    // ২. পার্সোনাল নোটিফিকেশন লিসেনার
    const qPersonal = query(
      collection(db, "notifications"),
      where("recipient", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubPersonal = onSnapshot(qPersonal, async (snap) => {
      const pNotifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // নতুন পার্সোনাল নোটিফিকেশন আসলে (যেমন: টাকা এপ্রুভ বা রিজেক্ট)
      const unread = snap.docs.filter(d => !d.data().read);
      if (!loading && unread.length > 0) {
        const latest = unread[0].data();
        triggerPushNotification(latest.title || "আপডেট", latest.body);
      }

      setPersonalNotifs(pNotifs);
      setLoading(false);

      // ব্যাকগ্রাউন্ডে রিড মার্ক করা
      if (unread.length > 0) {
        const batch = writeBatch(db);
        unread.forEach(d => batch.update(doc(db, "notifications", d.id), { read: true }));
        await batch.commit();
      }
    });

    return () => { unsubNotice(); unsubPersonal(); };
  }, [loading, notices.length]); // ডিপেন্ডেন্সি যোগ করা হয়েছে নির্ভুল নোটিফিকেশনের জন্য

  return (
    <div className={`min-h-screen transition-all duration-700 ${
        darkMode ? 'bg-[#020617] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      
      {/* স্টিকি গ্লসি হেডার */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-500 ${
        darkMode ? 'bg-[#020617]/80 border-white/10' : 'bg-white/80 border-slate-200/60'
      }`}>
        <div className="max-w-xl mx-auto px-6 py-6 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className={`p-3 rounded-2xl transition-all active:scale-90 border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                darkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
            }`}
          >
            <ArrowLeft size={18} /> ফিরে যান
          </button>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
               <Bell size={20} className="text-indigo-500 animate-pulse" />
               <h2 className="text-2xl font-black italic tracking-tighter">নোটিফিকেশন</h2>
            </div>
            <p className="text-[9px] font-black uppercase opacity-40 tracking-[0.2em]">News Feed & Updates</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-8 pb-24">
        {loading ? (
          <div className="space-y-6 py-10">
            {[1, 2, 3].map(i => (
                <div key={i} className={`h-40 rounded-[3rem] animate-pulse ${darkMode ? 'bg-white/5' : 'bg-slate-200/50'}`}></div>
            ))}
          </div>
        ) : (
          <>
            {/* পার্সোনাল আপডেট সেকশন */}
            {personalNotifs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
                    <Sparkles size={12}/> ব্যক্তিগত আপডেট
                   </span>
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
                </div>
                
                {personalNotifs.map((pn, idx) => (
                  <div key={pn.id} 
                    className={`p-6 rounded-[2.5rem] border-2 flex gap-4 items-center transition-all animate-slideIn ${
                        darkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-white shadow-xl shadow-slate-200/40'
                    }`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className={`p-4 rounded-2xl shrink-0 shadow-inner ${
                        pn.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {pn.type === 'success' ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-sm">{pn.title || 'Personal Update'}</h4>
                      <p className="text-xs opacity-60 mt-1 font-bold leading-relaxed">{pn.body}</p>
                      <div className="flex items-center gap-2 mt-3 opacity-30 font-black uppercase text-[8px] tracking-tighter">
                        <Clock size={10} />
                        {pn.createdAt?.toDate ? pn.createdAt.toDate().toLocaleTimeString('bn-BD') : 'Just now'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* জেনারেল নোটিশ সেকশন */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                    <Send size={12}/> সাধারণ নোটিশ
                   </span>
                   <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/5"></div>
                </div>

                {notices.length === 0 && personalNotifs.length === 0 ? (
                  <div className="text-center py-32 opacity-20 flex flex-col items-center">
                    <Megaphone size={80} strokeWidth={1} className="mb-6" />
                    <p className="font-black italic text-xl uppercase tracking-widest">No Bulletins Found</p>
                  </div>
                ) : (
                  notices.map((n, idx) => (
                    <div key={n.id} 
                        className={`group relative p-8 rounded-[3.5rem] border-2 transition-all duration-500 animate-slideIn ${
                            darkMode ? 'bg-slate-900/40 border-white/5 hover:border-indigo-500/30' : 'bg-white border-white shadow-2xl shadow-slate-200/60 hover:shadow-indigo-500/10'
                        }`}
                        style={{ animationDelay: `${(idx + personalNotifs.length) * 0.1}s` }}
                    >
                      <div className="flex gap-6 items-start">
                        <div className={`p-4 rounded-[1.8rem] shrink-0 shadow-lg ${
                            darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          <Megaphone size={24} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xl font-black tracking-tighter mb-2 italic ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {n.title || "জরুরি বিজ্ঞপ্তি"}
                          </h3>
                          
                          <p className={`text-[15px] font-bold leading-[1.7] mb-8 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {n.message}
                          </p>

                          <div className={`flex items-center justify-between pt-6 border-t border-dashed ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                            <div className="flex gap-4 opacity-40 text-[9px] font-black uppercase tracking-tighter">
                              <span className="flex items-center gap-1.5"><Calendar size={12}/> {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleDateString('bn-BD') : ''}</span>
                              <span className="flex items-center gap-1.5"><Clock size={12}/> {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString('bn-BD') : ''}</span>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              OFFICIAL
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .animate-slideIn {
          animation: slideIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          opacity: 0;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NoticeBoard;