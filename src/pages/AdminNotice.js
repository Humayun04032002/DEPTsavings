import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Megaphone, Trash2, Send, Clock, ArrowLeft, 
  Loader2, BellRing, Type, AlignLeft, User as UserIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminNotice = ({ darkMode }) => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Notice Fetch Error: ", error));
    return () => unsubscribe();
  }, []);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle || !cleanMessage) return alert("শিরোনাম এবং মেসেজ দুটিই লিখুন!");

    setLoading(true);
    try {
      await addDoc(collection(db, "notices"), {
        title: cleanTitle,
        message: cleanMessage,
        author: userData?.name || "Admin",
        createdAt: serverTimestamp(),
        type: "notice" 
      });

      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Admin",
        action: "নোটিশ পাবলিশ",
        details: `শিরোনাম: "${cleanTitle}"`,
        timestamp: serverTimestamp(),
        type: "info"
      });

      setTitle('');
      setMessage('');
    } catch (err) {
      alert("সমস্যা হয়েছে: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই নোটিশটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (err) {
      alert("ডিলিট করতে সমস্যা হয়েছে");
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-[#0B0F1A] text-white' : 'bg-slate-50 text-slate-900'} pb-12 overflow-x-hidden`}>
      
      {/* Mobile-Friendly Top Bar */}
      <div className={`sticky top-0 z-50 px-4 py-4 md:px-8 border-b backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/admin')} 
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-black text-sm md:text-lg tracking-widest uppercase italic">Notice Management</h1>
          <div className="w-10 h-10 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-500">
            <BellRing size={20} className="animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        {/* Write Notice Card */}
        <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-2xl border transition-all ${
          darkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-white shadow-slate-200/50'
        }`}>
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-indigo-600 p-3 md:p-4 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
                <Megaphone size={24} className="md:w-7 md:h-7" />
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none mb-1">নতুন নোটিশ</h2>
                <p className={`text-[9px] font-black uppercase tracking-widest opacity-50`}>Create Public Announcement</p>
            </div>
          </div>

          <form onSubmit={handlePostNotice} className="space-y-4">
            <div className="group relative">
              <Type className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-indigo-400' : 'text-slate-300 group-focus-within:text-indigo-600'}`} size={18} />
              <input 
                type="text"
                placeholder="নোটিশের শিরোনাম"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 outline-none transition-all font-bold text-sm md:text-base ${
                  darkMode ? 'bg-slate-800 border-slate-800 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-50 focus:border-indigo-500 text-slate-800'
                }`}
              />
            </div>

            <div className="group relative">
              <AlignLeft className={`absolute left-5 top-5 transition-colors ${darkMode ? 'text-slate-600 group-focus-within:text-indigo-400' : 'text-slate-300 group-focus-within:text-indigo-600'}`} size={18} />
              <textarea 
                className={`w-full pl-12 pr-6 py-5 rounded-[1.5rem] md:rounded-[2rem] border-2 outline-none h-32 md:h-40 resize-none transition-all font-medium text-sm md:text-base ${
                  darkMode ? 'bg-slate-800 border-slate-800 focus:border-indigo-500 text-white' : 'bg-slate-50 border-slate-50 focus:border-indigo-500 text-slate-700'
                }`}
                placeholder="বিস্তারিত বার্তা..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></textarea>
            </div>
            
            <button 
              disabled={loading || !message.trim() || !title.trim()}
              className="w-full bg-indigo-600 text-white py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black flex justify-center items-center gap-3 hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm md:text-base uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Send size={18}/> পাবলিশ করুন</>}
            </button>
          </form>
        </div>

        {/* Existing Notices List */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="opacity-40 font-black text-[10px] uppercase tracking-[0.25em] flex items-center gap-2">
                পূর্ববর্তী নোটিশসমূহ
            </h3>
            <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full">{notices.length}</span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {notices.map((notice) => (
              <div key={notice.id} className={`p-5 md:p-6 rounded-[2rem] border transition-all duration-300 relative group ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/40' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100'
              }`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-base md:text-lg font-black tracking-tight mb-2 truncate ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {notice.title}
                    </h4>
                    <p className={`font-bold leading-relaxed whitespace-pre-wrap text-[13px] md:text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {notice.message}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(notice.id)}
                    className={`shrink-0 p-3 rounded-xl transition-all active:scale-75 ${
                      darkMode ? 'bg-slate-800 text-slate-600 hover:text-rose-500' : 'bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500'
                    }`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-dashed border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 opacity-40 text-[9px] font-black uppercase tracking-tighter">
                    <Clock size={12} />
                    {notice.createdAt?.seconds 
                      ? new Date(notice.createdAt.seconds * 1000).toLocaleString('bn-BD', { dateStyle: 'long' }) 
                      : "..."}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg ${
                    darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <UserIcon size={10} /> {notice.author}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notices.length === 0 && !loading && (
            <div className={`text-center py-20 rounded-[2.5rem] border-2 border-dashed ${
              darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
                <Megaphone size={40} className="mx-auto mb-4 opacity-10" />
                <p className="opacity-20 font-black italic text-xs tracking-wider">বর্তমানে কোনো নোটিশ নেই</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotice;