import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { 
  collection, onSnapshot, query, where, doc, 
  runTransaction, serverTimestamp 
} from 'firebase/firestore';
import { Search, ArrowLeft, Landmark, Loader2, CheckCircle2, History, X, ChevronRight, User, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLoanRepayment = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [activeLoans, setActiveLoans] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "loans"), where("remainingBalance", ">", 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActiveLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Loan fetch error:", error));
    return () => unsubscribe();
  }, []);

  const openRepaymentModal = (loan) => {
    setSelectedLoan(loan);
    setRepaymentAmount(loan.monthlyInstallment.toString());
    setIsModalOpen(true);
  };

  // সব বকেয়া এক ক্লিকে সেট করার ফাংশন
  const handleFullRepayment = () => {
    if (selectedLoan) {
      setRepaymentAmount(selectedLoan.remainingBalance.toString());
    }
  };

  const handleRepayment = async (e) => {
    e.preventDefault();
    const amount = Number(repaymentAmount);

    if (!amount || amount <= 0) return alert("সঠিক পরিমাণ লিখুন");
    if (amount > selectedLoan.remainingBalance) return alert("বকেয়ার চেয়ে বেশি টাকা নেওয়া সম্ভব নয়");

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const loanRef = doc(db, "loans", selectedLoan.id);
        const repaymentRef = doc(collection(db, "repayments"));
        const logRef = doc(collection(db, "logs"));

        transaction.update(loanRef, {
          remainingBalance: selectedLoan.remainingBalance - amount,
          lastPaymentDate: serverTimestamp()
        });

        transaction.set(repaymentRef, {
          loanId: selectedLoan.id,
          userId: selectedLoan.userId,
          memberName: selectedLoan.memberName,
          paidAmount: amount,
          collectedBy: userData?.name || "Admin",
          date: serverTimestamp()
        });

        transaction.set(logRef, {
          adminName: userData?.name || "Admin",
          action: "কিস্তি আদায়",
          details: `${selectedLoan.memberName}-এর কাছ থেকে ৳${amount} আদায় করা হয়েছে।`,
          timestamp: serverTimestamp(),
          type: "loan"
        });
      });

      setIsModalOpen(false);
      setRepaymentAmount('');
    } catch (err) {
      alert("সমস্যা হয়েছে: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = activeLoans.filter(l => 
    l.memberName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-full transition-all active:scale-90">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-slate-800 tracking-tight">কিস্তি কালেকশন</h1>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">Loan Management</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black border border-emerald-100">
            {activeLoans.length}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* Advanced Search */}
        <div className="relative mb-6">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="সদস্যের নাম দিয়ে খুঁজুন..." 
            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-2 border-white bg-white shadow-xl shadow-slate-200/50 outline-none focus:border-emerald-500 transition-all font-bold text-slate-600"
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Loan List */}
        <div className="space-y-4">
          {filteredLoans.length > 0 ? filteredLoans.map((loan) => (
            <div 
              key={loan.id} 
              onClick={() => openRepaymentModal(loan)}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex items-center gap-4 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                <User size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 truncate">{loan.memberName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase">বকেয়া: ৳{loan.remainingBalance}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">কিস্তি</p>
                <p className="text-lg font-black text-slate-800 italic">৳{loan.monthlyInstallment}</p>
              </div>
              <div className="ml-2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                <ChevronRight size={20} />
              </div>
            </div>
          )) : (
            <div className="py-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Landmark size={32} />
              </div>
              <p className="text-slate-400 font-bold">কোনো সক্রিয় লোন পাওয়া যায়নি</p>
            </div>
          )}
        </div>
      </div>

      {/* Repayment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 duration-400">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 md:hidden"></div>

            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">কিস্তি জমা নিন</h2>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">{selectedLoan?.memberName}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-slate-900 rounded-3xl p-6 text-white mb-8 shadow-xl">
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">বর্তমান বকেয়া</span>
                  <span className="text-xl font-black italic text-rose-400">৳{selectedLoan?.remainingBalance?.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নির্ধারিত কিস্তি</span>
                  <span className="text-lg font-black">৳{selectedLoan?.monthlyInstallment?.toLocaleString('bn-BD')}</span>
                </div>
              </div>

              <form onSubmit={handleRepayment} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">জমার পরিমাণ (৳)</label>
                    {/* বকেয়া ক্লিয়ার করার বাটন */}
                    <button 
                      type="button" 
                      onClick={handleFullRepayment}
                      className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors flex items-center gap-1 uppercase"
                    >
                      <Zap size={10} /> সব পরিশোধ
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">৳</span>
                    <input 
                      type="number" 
                      autoFocus
                      className="w-full pl-12 pr-6 py-5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-3xl font-black text-slate-800 transition-all"
                      value={repaymentAmount}
                      onChange={(e) => setRepaymentAmount(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !repaymentAmount}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-100 flex justify-center items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (
                    <>পেমেন্ট নিশ্চিত করুন <CheckCircle2 size={20}/></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoanRepayment;