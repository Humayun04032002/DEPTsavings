import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; 
import { 
  collection, onSnapshot, query, where, doc, setDoc, 
  orderBy, limit 
} from 'firebase/firestore';
import { 
  Users, CheckCircle, LogOut, Wallet, 
  Bell, ShieldCheck, UserPlus, DollarSign, Activity, 
  Settings, Smartphone, X, Calendar, Megaphone, UserRoundCheck, Clock, CreditCard 
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth(); 
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  // State for settings
  const [paySettings, setPaySettings] = useState({ bkash: '', nagad: '' });
  const [collectionSettings, setCollectionSettings] = useState({ startDate: '01', endDate: '10' });
  const [stats, setStats] = useState({ 
    totalSavings: 0, totalLoan: 0, pendingDeposits: 0,
    pendingMemberRequests: 0, memberCount: 0 
  });

  useEffect(() => {
    // ১. মেম্বার ডাটা ও টোটাল সেভিংস
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      let totalS = 0; let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if(data.role === 'member') { 
          totalS += Number(data.totalSavings || 0); 
          count++; 
        }
      });
      setStats(prev => ({ ...prev, totalSavings: totalS, memberCount: count }));
    });

    // ২. পেন্ডিং ডিপোজিট
    const unsubDeposits = onSnapshot(query(collection(db, "deposits"), where("status", "==", "pending")), (snap) => {
      setStats(prev => ({ ...prev, pendingDeposits: snap.size }));
    });

    // ৩. নতুন মেম্বার রিকোয়েস্ট
    const unsubReqs = onSnapshot(query(collection(db, "memberRequests"), where("status", "==", "pending")), (snap) => {
      setStats(prev => ({ ...prev, pendingMemberRequests: snap.size }));
    });

    // ৪. টোটাল লোন
    const unsubLoans = onSnapshot(query(collection(db, "loans"), where("status", "==", "approved")), (snap) => {
      let totalL = 0;
      snap.forEach((doc) => totalL += Number(doc.data().remainingBalance || 0));
      setStats(prev => ({ ...prev, totalLoan: totalL }));
    });

    // ৫. সেটিংস লোড (রিয়েল-টাইম)
    const unsubPaySettings = onSnapshot(doc(db, "settings", "pay_settings"), (d) => {
      if(d.exists()) setPaySettings(d.data());
    });

    const unsubColSettings = onSnapshot(doc(db, "settings", "collection_config"), (d) => {
      if(d.exists()) setCollectionSettings(d.data());
    });

    return () => { 
      unsubUsers(); unsubDeposits(); unsubReqs(); unsubLoans(); 
      unsubPaySettings(); unsubColSettings();
    };
  }, []);

  const totalNotifications = stats.pendingDeposits + stats.pendingMemberRequests;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await setDoc(doc(db, "settings", "pay_settings"), {
        bkash: paySettings.bkash,
        nagad: paySettings.nagad,
        updatedAt: new Date().toISOString()
      });
      
      await setDoc(doc(db, "settings", "collection_config"), {
        startDate: collectionSettings.startDate,
        endDate: collectionSettings.endDate,
        updatedAt: new Date().toISOString()
      });

      alert("সিস্টেম সেটিংস সফলভাবে আপডেট হয়েছে!");
      setShowSettings(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 font-sans overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-slate-950 pt-8 pb-28 px-4 md:px-6 rounded-b-[3rem] md:rounded-b-[4rem] shadow-2xl relative">
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">Admin Panel</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> {userData?.name || 'অ্যাডমিন'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 bg-white/10 text-white rounded-2xl border border-white/10 active:scale-90 transition-transform"
              >
                <Bell size={20} />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-950 animate-bounce"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notifications</h4>
                  <div className="space-y-2">
                    {stats.pendingMemberRequests > 0 && (
                      <div onClick={() => navigate('/admin/add-member')} className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl cursor-pointer">
                        <UserPlus size={14} className="text-emerald-600" />
                        <p className="text-[11px] font-bold text-slate-700">{stats.pendingMemberRequests}টি নতুন সদস্য আবেদন</p>
                      </div>
                    )}
                    {stats.pendingDeposits > 0 && (
                      <div onClick={() => navigate('/admin/approvals')} className="flex items-center gap-3 p-2 bg-orange-50 rounded-xl cursor-pointer">
                        <CheckCircle size={14} className="text-orange-600" />
                        <p className="text-[11px] font-bold text-slate-700">{stats.pendingDeposits}টি জমা অনুমোদন পেন্ডিং</p>
                      </div>
                    )}
                    {totalNotifications === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-2 italic font-bold">নতুন কোনো নোটিফিকেশন নেই</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => auth.signOut()} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 active:scale-90 transition-transform">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          <QuickStat label="সঞ্চয় (মোট)" value={stats.totalSavings} icon={<Wallet size={18}/>} color="emerald" />
          <QuickStat label="বকেয়া লোন" value={stats.totalLoan} icon={<CreditCard size={18}/>} color="indigo" />
          <QuickStat label="মোট সদস্য" value={stats.memberCount} icon={<Users size={18}/>} color="blue" />
          <QuickStat label="পেন্ডিং কাজ" value={totalNotifications} icon={<Clock size={18}/>} color="rose" isCritical={totalNotifications > 0} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-12 relative z-20">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" /> ম্যানেজমেন্ট টুলস
          </h2>
          <button onClick={() => setShowSettings(true)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-600 hover:text-indigo-600 transition-colors">
            <Settings size={20} />
          </button>
        </div>

        {/* Action Grid - Paths synchronized with App.js */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <MenuCard onClick={() => navigate('/admin/add-member')} title="সদস্য রিকোয়েস্ট" icon={<UserPlus />} color="emerald" badge={stats.pendingMemberRequests} />
          <MenuCard onClick={() => navigate('/admin/approvals')} title="জমা অনুমোদন" icon={<CheckCircle />} color="orange" badge={stats.pendingDeposits} />
          <MenuCard onClick={() => navigate('/admin/members')} title="সদস্য তালিকা" icon={<Users />} color="blue" />
          <MenuCard onClick={() => navigate('/admin/staff')} title="অ্যাডমিন ও স্টাফ" icon={<UserRoundCheck />} color="slate" />
          <MenuCard onClick={() => navigate('/admin/notice')} title="নোটিশ বোর্ড" icon={<Megaphone />} color="purple" />
          <MenuCard onClick={() => navigate('/admin/add-loan')} title="লোন প্রদান" icon={<DollarSign />} color="rose" />
          <MenuCard onClick={() => navigate('/admin/loan-repayment')} title="কিস্তি আদায়" icon={<Wallet />} color="teal" />
          <MenuCard onClick={() => navigate('/admin/activity-logs')} title="অ্যাক্টিভিটি লগ" icon={<Clock />} color="amber" />
        </div>
        
        {/* Footer Info View */}
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner"><Smartphone size={24}/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">পেমেন্ট মেথড (লাইভ)</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-pink-500 rounded-full"></span> বিকাশ: {paySettings.bkash || 'সেট নেই'}</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-orange-500 rounded-full"></span> নগদ: {paySettings.nagad || 'সেট নেই'}</span>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 p-5 rounded-[2.5rem] flex items-center gap-5 shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm"><Calendar size={24}/></div>
            <div className="relative z-10 text-white">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-wider">কালেকশন পিরিয়ড</p>
              <p className="font-bold text-base">মাসের {collectionSettings.startDate || '০১'} থেকে {collectionSettings.endDate || '১০'} তারিখ</p>
            </div>
            <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSettings(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 md:hidden"></div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">System Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1">কালেকশন সময়সীমা</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">শুরু (তারিখ)</label>
                    <input type="text" placeholder="01" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-800 border border-slate-100 focus:ring-2 ring-indigo-500/20 outline-none" value={collectionSettings.startDate} onChange={(e)=>setCollectionSettings({...collectionSettings, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">শেষ (তারিখ)</label>
                    <input type="text" placeholder="10" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-800 border border-slate-100 focus:ring-2 ring-indigo-500/20 outline-none" value={collectionSettings.endDate} onChange={(e)=>setCollectionSettings({...collectionSettings, endDate: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest ml-1">পেমেন্ট গেটওয়ে নম্বর</p>
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-pink-500 bg-pink-50 px-2 py-1 rounded-md">BKASH</span>
                    <input type="text" placeholder="বিকাশ নম্বর" className="w-full bg-slate-50 p-4 pl-20 rounded-2xl font-bold border border-slate-100 outline-none focus:border-pink-200" value={paySettings.bkash} onChange={(e)=>setPaySettings({...paySettings, bkash: e.target.value})} />
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-md">NAGAD</span>
                    <input type="text" placeholder="নগদ নম্বর" className="w-full bg-slate-50 p-4 pl-20 rounded-2xl font-bold border border-slate-100 outline-none focus:border-orange-200" value={paySettings.nagad} onChange={(e)=>setPaySettings({...paySettings, nagad: e.target.value})} />
                  </div>
                </div>
              </div>

              <button disabled={saveLoading} type="submit" className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 mt-4">
                {saveLoading ? "Saving..." : "Update System Settings"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-components
const QuickStat = ({ label, value, icon, color, isCritical }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    indigo: 'bg-indigo-500/10 text-indigo-600',
    blue: 'bg-blue-500/10 text-blue-600',
    rose: 'bg-rose-500/10 text-rose-600'
  };
  return (
    <div className={`p-4 md:p-6 rounded-[2rem] bg-white border border-slate-100 flex flex-col justify-between h-28 md:h-40 transition-all ${isCritical ? 'ring-2 ring-rose-500/20 shadow-lg shadow-rose-100' : 'shadow-sm hover:shadow-md'}`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-base md:text-2xl font-black text-slate-900 truncate">
          {typeof value === 'number' && value >= 1000 ? `৳${(value/1000).toFixed(1)}k` : `৳${value}`}
        </p>
      </div>
    </div>
  );
};

const MenuCard = ({ onClick, title, icon, color, badge }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
    teal: 'bg-teal-50 text-teal-600',
    slate: 'bg-slate-50 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <button 
      onClick={onClick}
      className="group relative bg-white p-5 md:p-8 rounded-[2.5rem] border border-slate-100 flex flex-col items-center justify-center gap-4 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 active:scale-95 transition-all text-center h-full min-h-[140px]"
    >
      {badge > 0 && (
        <span className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-black h-6 w-6 rounded-full flex items-center justify-center border-4 border-white shadow-lg shadow-rose-200 animate-pulse">
          {badge}
        </span>
      )}
      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${colorMap[color]}`}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <h3 className="font-black text-[11px] md:text-[13px] text-slate-800 uppercase leading-tight tracking-tight">{title}</h3>
    </button>
  );
};

export default AdminDashboard;