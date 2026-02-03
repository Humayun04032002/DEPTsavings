import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Clock, User, ArrowLeft, Activity, ShieldCheck, UserPlus, Landmark, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ১. সর্বশেষ ৫০টি লগ লোড করা (Timestamp-ভিত্তিক অর্ডার)
    const q = query(
      collection(db, "logs"), 
      orderBy("timestamp", "desc"), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // লগের ধরণ অনুযায়ী আইকন রিটার্ন করার ফাংশন
  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <UserPlus size={16} />;
      case 'loan': return <Landmark size={16} />;
      case 'danger': return <Trash2 size={16} />;
      default: return <ShieldCheck size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => navigate('/admin')} 
          className="group flex items-center gap-2 text-slate-500 mb-8 font-bold hover:text-rose-600 transition-all"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-rose-50 transition-colors">
            <ArrowLeft size={20} />
          </div>
          ড্যাশবোর্ড
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 px-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-rose-500 p-2.5 rounded-xl text-white shadow-lg shadow-rose-100">
                <Activity size={28} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Audit Trail</h2>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] ml-1">সিস্টেমের সাম্প্রতিক সকল কর্মকাণ্ড</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        {/* Timeline Start */}
        <div className="relative ml-4 md:ml-6 border-l-2 border-slate-200 space-y-8 pb-20">
          {loading ? (
             <div className="flex justify-center p-20">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500" />
             </div>
          ) : logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="relative pl-10 group">
                {/* Timeline Connector Dot */}
                <div className="absolute -left-[11px] top-1.5 w-5 h-5 bg-white border-4 border-slate-200 rounded-full group-hover:border-rose-500 group-hover:scale-125 transition-all duration-300"></div>
                
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-white hover:border-rose-100 hover:shadow-xl hover:shadow-rose-100/20 transition-all duration-300 relative overflow-hidden">
                  
                  {/* Category Tag & Meta */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        log.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                        log.type === 'loan' ? 'bg-blue-50 text-blue-600' : 
                        log.type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {getLogIcon(log.type)}
                        {log.action}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <User size={12} className="text-slate-400" />
                        <span className="text-[11px] font-black">{log.adminName}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold italic">
                      <Clock size={13} className="text-rose-300" />
                      {log.timestamp ? log.timestamp.toDate().toLocaleString('bn-BD', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : 'প্রসেসিং...'}
                    </div>
                  </div>

                  {/* Log Content */}
                  <div className="relative z-10">
                    <p className="text-slate-600 font-bold leading-relaxed text-sm md:text-base">
                      {log.details}
                    </p>
                  </div>

                  {/* Subtle Background Icon */}
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-slate-900 group-hover:scale-110 transition-transform">
                    {getLogIcon(log.type)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="ml-10 bg-white border-2 border-dashed border-slate-200 p-16 rounded-[3rem] text-center">
              <AlertTriangle size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black italic uppercase tracking-widest text-xs">
                কোনো কর্মকাণ্ডের রেকর্ড পাওয়া যায়নি
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLog;