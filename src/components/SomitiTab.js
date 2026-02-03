import React, { useState, useEffect } from 'react';
import { Users, Activity, PieChart as PieIcon, ArrowUpRight, ShieldCheck, Wallet, ChevronRight, X, User, Sparkles } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const SomitiTab = ({ darkMode }) => {
  const [globalStats, setGlobalStats] = useState({ 
    totalFund: 0, 
    totalLoan: 0, 
    activeMembers: 0,
  });
  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      let fund = 0;
      let memberList = [];
      snap.forEach(d => {
        const data = d.data();
        fund += Number(data.totalSavings || 0);
        memberList.push({ id: d.id, ...data });
      });
      setMembers(memberList);
      setGlobalStats(prev => ({ ...prev, totalFund: fund, activeMembers: snap.size }));
    });

    const qLoans = query(collection(db, "loans"), where("status", "==", "approved"));
    const unsubLoans = onSnapshot(qLoans, (snap) => {
      let loans = 0;
      snap.forEach(d => loans += Number(d.data().remainingBalance || 0));
      setGlobalStats(prev => ({ ...prev, totalLoan: loans }));
    });

    return () => { unsubUsers(); unsubLoans(); };
  }, []);

  const chartData = [
    { name: 'সঞ্চয়', amount: globalStats.totalFund, color: '#10b981' },
    { name: 'ঋণ', amount: globalStats.totalLoan, color: '#f43f5e' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-32">
      
      {/* ১. মেইন গ্লাস কার্ড (Chart Section) */}
      <div className={`relative p-8 rounded-[3.5rem] border overflow-hidden backdrop-blur-xl transition-all duration-700 ${
        darkMode 
        ? 'bg-white/[0.03] border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]' 
        : 'bg-white/70 border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
      }`}>
        {/* ব্যাকগ্রাউন্ড গ্লো ইফেক্ট */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-emerald-500" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Overview</p>
              </div>
              <h3 className={`text-3xl font-black italic tracking-tighter ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                সমিতি এনালিটিক্স
              </h3>
            </div>
            <div className={`p-4 rounded-3xl backdrop-blur-md ${darkMode ? 'bg-white/5 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600'}`}>
              <PieIcon size={24} />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: '800'}} />
                <Tooltip 
                  cursor={{fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}} 
                  contentStyle={{ borderRadius: '20px', border: 'none', backdropBlur: '10px', backgroundColor: darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Bar dataKey="amount" radius={[15, 15, 15, 15]} barSize={50}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ২. গ্লাস গ্রিড কার্ডস */}
      <div className="grid grid-cols-2 gap-5">
        <button 
          onClick={() => setShowMemberModal(true)}
          className={`group relative p-6 rounded-[2.8rem] border backdrop-blur-lg transition-all active:scale-95 text-left ${
            darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white/60 border-white/80 shadow-lg shadow-slate-200/50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 border border-indigo-500/20">
            <Users size={22} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">সদস্যবৃন্দ</p>
          <div className="flex items-center justify-between">
            <h4 className={`text-2xl font-black italic ${darkMode ? 'text-white' : 'text-slate-800'}`}>{globalStats.activeMembers}</h4>
            <ChevronRight size={16} className="opacity-30 group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <div className={`relative p-6 rounded-[2.8rem] border backdrop-blur-lg transition-all ${
          darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white/60 border-white/80 shadow-lg shadow-slate-200/50'
        }`}>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 text-rose-500 border border-rose-500/20">
            <ArrowUpRight size={22} />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট ঋণ</p>
          <h4 className={`text-2xl font-black italic ${darkMode ? 'text-white' : 'text-slate-800'}`}>৳{globalStats.totalLoan.toLocaleString('bn-BD')}</h4>
        </div>
      </div>

      {/* ৩. প্রিমিয়াম গ্লাস ফান্ড কার্ড */}
      <div className={`relative p-10 rounded-[3.5rem] border overflow-hidden transition-all duration-500 group ${
        darkMode ? 'bg-gradient-to-br from-emerald-600/20 to-teal-900/20 border-emerald-500/30' : 'bg-gradient-to-br from-emerald-500 to-teal-700 border-white/20 text-white shadow-2xl shadow-emerald-500/30'
      }`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -mr-32 -mt-32 transition-colors ${darkMode ? 'bg-emerald-500/10' : 'bg-white/20'}`} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Wallet size={18} className={darkMode ? 'text-emerald-400' : 'text-white'} />
            </div>
            <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${darkMode ? 'text-emerald-400/80' : 'text-white/70'}`}>সমিতির মোট ফান্ড</p>
          </div>
          
          <h2 className={`text-5xl font-black italic tracking-tighter mb-4 ${darkMode ? 'text-white' : 'text-white'}`}>
            ৳{globalStats.totalFund.toLocaleString('bn-BD')}
          </h2>
          
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className={darkMode ? 'text-emerald-400' : 'text-emerald-200'} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-400/60' : 'text-emerald-100/60'}`}>Verified & Encrypted</span>
          </div>
        </div>
        
        <Activity size={150} className="absolute -bottom-10 -right-10 opacity-[0.05] -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
      </div>

      {/* ৪. গ্লাস মডাল (Member List) */}
      {showMemberModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 backdrop-blur-md bg-black/40">
          <div className="absolute inset-0" onClick={() => setShowMemberModal(false)}></div>
          <div className={`relative w-full max-w-md max-h-[75vh] overflow-hidden rounded-[3rem] border animate-slideUp backdrop-blur-2xl ${
            darkMode ? 'bg-slate-900/90 border-white/10 shadow-2xl' : 'bg-white/90 border-white shadow-2xl'
          }`}>
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className={`text-2xl font-black italic tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>সদস্যবৃন্দ</h3>
                <button onClick={() => setShowMemberModal(false)} className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-white/5 text-white hover:bg-rose-500/20' : 'bg-slate-100 text-slate-500'}`}>
                  <X size={20}/>
                </button>
              </div>
              
              <div className="space-y-4 overflow-y-auto max-h-[45vh] pr-2 custom-scrollbar">
                {members.map((member) => (
                  <div key={member.id} className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all ${
                    darkMode ? 'bg-white/5 border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <User size={22} />
                    </div>
                    <div>
                      <p className={`font-black text-[15px] ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{member.name}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Reg: {member.regNo || '---'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SomitiTab;