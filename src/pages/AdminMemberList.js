import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; 
import { 
  collection, onSnapshot, query, where, doc, 
  runTransaction, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { Search, Phone, ArrowLeft, PlusCircle, X, Loader2, Users, Wallet, Eye, Calendar, Edit3, ChevronRight } from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';

const AdminMemberList = () => {
  const { userData } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [amount, setAmount] = useState('');
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(`${months[new Date().getMonth()]} ${currentYear}`);
  
  const [editingTarget, setEditingTarget] = useState(null);
  const [newMonthlyTarget, setNewMonthlyTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "member"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (error) => console.error("Error: ", error));
    return () => unsubscribe();
  }, []);

  const handleUpdateTarget = async (memberId) => {
    if (!newMonthlyTarget || newMonthlyTarget <= 0) return;
    try {
      await updateDoc(doc(db, "users", memberId), { monthlyTarget: Number(newMonthlyTarget) });
      setEditingTarget(null);
    } catch (err) { alert("Error updating target"); }
  };

  const handleDirectDeposit = async (e) => {
    e.preventDefault();
    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) return alert("সঠিক পরিমাণ লিখুন");

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", selectedMember.id);
        const userDoc = await transaction.get(userRef);
        const currentSavings = Number(userDoc.data().totalSavings || 0);

        transaction.update(userRef, {
          totalSavings: currentSavings + depositAmount,
          lastDepositDate: serverTimestamp()
        });

        const depositRef = doc(collection(db, "deposits"));
        transaction.set(depositRef, {
          userId: selectedMember.id,
          memberName: selectedMember.name,
          amount: depositAmount,
          month: selectedMonth,
          status: "approved",
          method: "Cash (Admin)",
          collectedBy: userData?.name || "Admin",
          timestamp: serverTimestamp()
        });
      });

      setSelectedMember(null);
      setAmount('');
    } catch (err) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  const filtered = members.filter(m => 
    (m.name?.toLowerCase().includes(search.toLowerCase())) || 
    (m.phone?.includes(search))
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 overflow-x-hidden">
      {/* Sticky Mobile Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-slate-800 tracking-tight">সদস্য তালিকা</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">Management Portal</p>
          </div>
          <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black border border-blue-100">
            {members.length}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* Search Bar - Advanced UI */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="নাম অথবা মোবাইল নাম্বার..." 
            className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-white bg-white shadow-xl shadow-slate-200/50 outline-none focus:border-blue-500 transition-all font-bold text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Member Cards */}
        <div className="space-y-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                {/* Profile Image/Initial */}
                <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                  {member.name ? member.name[0] : '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-800 truncate">{member.name}</h3>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="text-[11px] font-bold flex items-center gap-1"><Phone size={10}/> {member.phone}</span>
                    <span 
                      onClick={() => {setEditingTarget(member.id); setNewMonthlyTarget(member.monthlyTarget)}}
                      className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={10}/> ৳{member.monthlyTarget || 0}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">সঞ্চয়</p>
                  <p className="text-base font-black text-slate-800 italic">৳{Number(member.totalSavings || 0).toLocaleString('bn-BD')}</p>
                </div>
              </div>

              {/* Edit Target Form Inline */}
              {editingTarget === member.id && (
                <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <input 
                    type="number" 
                    className="flex-1 bg-slate-50 rounded-xl px-4 py-2 text-sm font-bold border-none focus:ring-1 focus:ring-blue-500" 
                    value={newMonthlyTarget}
                    onChange={(e) => setNewMonthlyTarget(e.target.value)}
                  />
                  <button onClick={() => handleUpdateTarget(member.id)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">সেভ</button>
                  <button onClick={() => setEditingTarget(null)} className="text-slate-400 font-bold text-xs px-2">X</button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button 
                  onClick={() => navigate(`/admin/member/${member.id}`)}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  <Eye size={16} /> বিস্তারিত দেখুন
                </button>
                <button 
                  onClick={() => setSelectedMember(member)}
                  className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:bg-blue-700"
                >
                  <PlusCircle size={16} /> টাকা জমা দিন
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modern Bottom Sheet-style Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedMember(null)}></div>
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 duration-300">
            <div className="bg-slate-900 p-8 text-white relative">
              <button onClick={() => setSelectedMember(null)} className="absolute right-6 top-6 text-slate-400 hover:text-white"><X size={24} /></button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Wallet size={24} /></div>
                <div>
                  <h3 className="text-xl font-black italic">ক্যাশ জমা</h3>
                  <p className="text-xs text-slate-400 font-bold">{selectedMember.name}</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleDirectDeposit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">কিস্তির মাস</label>
                <select 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(m => <option key={m} value={`${m} ${currentYear}`}>{m} {currentYear}</option>)}
                  <option value={`January ${currentYear + 1}`}>January {currentYear + 1}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">টাকার পরিমাণ</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">৳</span>
                  <input 
                    type="number" 
                    required 
                    autoFocus
                    className="w-full pl-12 pr-6 py-5 bg-slate-50 rounded-2xl border-none text-3xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !amount}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 flex justify-center items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "নিশ্চিত করুন"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMemberList;