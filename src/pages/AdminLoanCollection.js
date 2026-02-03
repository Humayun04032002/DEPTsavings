import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { 
  collection, onSnapshot, query, where, doc, 
  runTransaction, serverTimestamp 
} from 'firebase/firestore';
import { ArrowLeft, Wallet, User, History, Loader2, CheckCircle2, AlertTriangle, ChevronDown, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLoanRepayment = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "loans"), where("remainingBalance", ">", 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();
    // দশমিকের ঝামেলা এড়াতে নম্বর ফরম্যাট করা
    const paymentAmount = parseFloat(Number(amount).toFixed(2));

    if (!selectedLoan || !paymentAmount || paymentAmount <= 0) return alert("সব তথ্য সঠিকভাবে দিন");
    if (paymentAmount > selectedLoan.remainingBalance) return alert("বকেয়ার চেয়ে বেশি টাকা গ্রহণ করা সম্ভব নয়!");

    setLoading(true);
    try {
      await runTransaction(db, async (transaction) => {
        const loanRef = doc(db, "loans", selectedLoan.id);
        const loanDoc = await transaction.get(loanRef);

        if (!loanDoc.exists()) throw new Error("রেকর্ডটি পাওয়া যায়নি!");

        const currentBalance = loanDoc.data().remainingBalance;
        const newBalance = currentBalance - paymentAmount;

        // ১. লোন ব্যালেন্স আপডেট
        transaction.update(loanRef, {
          remainingBalance: newBalance,
          lastPaymentDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // ২. কিস্তি আদায়ের মেইন রেকর্ড (Repayments Collection)
        // এটি আপনার আগের সিকিউরিটি রুলসের সাথে মিল রেখে করা হয়েছে
        const repaymentRef = doc(collection(db, "repayments"));
        transaction.set(repaymentRef, {
          loanId: selectedLoan.id,
          userId: selectedLoan.userId,
          memberName: selectedLoan.memberName,
          paidAmount: paymentAmount,
          date: serverTimestamp(),
          collectedBy: userData?.name || "Admin"
        });

        // ৩. জেনারেল ট্রানজেকশন হিস্ট্রি (Transactions Collection)
        const transRef = doc(collection(db, "transactions"));
        transaction.set(transRef, {
          loanId: selectedLoan.id,
          memberId: selectedLoan.userId,
          memberName: selectedLoan.memberName,
          amount: paymentAmount,
          type: "loan_repayment",
          timestamp: serverTimestamp(),
          collectedBy: userData?.name || "Admin"
        });

        // ৪. সিকিউরিটি লগ
        const logRef = doc(collection(db, "logs"));
        transaction.set(logRef, {
          adminName: userData?.name || "Admin",
          action: "কিস্তি আদায়",
          details: `${selectedLoan.memberName}-এর কাছ থেকে ৳${paymentAmount} আদায় করা হয়েছে।`,
          timestamp: serverTimestamp(),
          type: "loan" // type 'success' এর বদলে 'loan' করা হলো ফিল্টার করার সুবিধার জন্য
        });
      });

      setSuccess(true);
      setAmount('');
      setSelectedLoan(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Transaction failed: ", err);
      alert("ত্রুটি: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-12 overflow-x-hidden font-sans">
      {/* Header, Form and UI elements remain the same as your provided code */}
      {/* ... (বাকি UI কোড অপরিবর্তিত থাকবে) ... */}
      <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-lg border-b border-slate-100 px-4 py-4">
         <div className="max-w-xl mx-auto flex items-center gap-4">
           <button onClick={() => navigate('/admin')} className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl active:scale-90 transition-all">
             <ArrowLeft size={20} className="text-slate-600" />
           </button>
           <h1 className="text-lg font-black text-slate-800 tracking-tight italic">LOAN REPAYMENT</h1>
         </div>
       </div>

       <div className="max-w-xl mx-auto px-4 mt-6">
         <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-white relative overflow-hidden">
           
           {success && (
             <div className="absolute inset-0 bg-emerald-600 z-50 flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
               <div className="bg-white/20 p-6 rounded-full mb-4 animate-bounce">
                 <CheckCircle2 size={60} />
               </div>
               <h3 className="text-2xl font-black">পেমেন্ট সফল!</h3>
               <p className="font-bold opacity-80 uppercase tracking-widest text-[10px] mt-2">Database Updated</p>
             </div>
           )}

           <div className="flex flex-col items-center mb-10">
             <div className="bg-emerald-50 text-emerald-600 p-5 rounded-3xl mb-4">
               <Landmark size={35} />
             </div>
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">কিস্তি গ্রহণ</h2>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Collect Monthly Installment</p>
           </div>

           <form onSubmit={handlePayment} className="space-y-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1">
                 <User size={12} className="text-emerald-500" /> লোন একাউন্ট নির্বাচন
               </label>
               <div className="relative group">
                 <select 
                   required
                   className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                   value={selectedLoan?.id || ""}
                   onChange={(e) => setSelectedLoan(loans.find(l => l.id === e.target.value))}
                 >
                   <option value="">সদস্য সিলেক্ট করুন...</option>
                   {loans.map(l => (
                     <option key={l.id} value={l.id}>{l.memberName} (বকেয়া: ৳{l.remainingBalance})</option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
               </div>
             </div>

             {selectedLoan && (
               <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl animate-in slide-in-from-top-4 duration-500">
                 <div className="flex justify-between items-center mb-6">
                   <div>
                     <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none">বর্তমান বকেয়া</p>
                     <p className="text-3xl font-black italic mt-1">৳ {selectedLoan.remainingBalance.toLocaleString('bn-BD')}</p>
                   </div>
                   <div className="bg-white/10 p-3 rounded-2xl">
                     <Wallet size={24} className="text-emerald-400" />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pt-5 border-t border-white/10">
                   <div>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">মাসিক কিস্তি</p>
                     <p className="text-sm font-bold">৳ {selectedLoan.monthlyInstallment?.toFixed(0)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">শেষ পেমেন্ট</p>
                     <p className="text-sm font-bold">
                       {selectedLoan.lastPaymentDate ? new Date(selectedLoan.lastPaymentDate.seconds * 1000).toLocaleDateString('bn-BD') : 'নেই'}
                     </p>
                   </div>
                 </div>
               </div>
             )}

             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center gap-1">
                 <History size={12} className="text-emerald-500" /> টাকার পরিমাণ (৳)
               </label>
               <div className="relative group">
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xl group-focus-within:text-emerald-500 transition-colors">৳</span>
                 <input 
                   type="number" 
                   required 
                   placeholder="0.00" 
                   className="w-full pl-12 pr-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all text-2xl font-black text-slate-700" 
                   value={amount} 
                   onChange={(e) => setAmount(e.target.value)} 
                 />
               </div>
             </div>

             <button 
               disabled={loading || !selectedLoan || !amount || Number(amount) > selectedLoan.remainingBalance} 
               className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-200 flex justify-center items-center gap-3 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale uppercase tracking-[0.2em] text-sm"
             >
               {loading ? <Loader2 className="animate-spin" /> : <>নিশ্চিত করুন <CheckCircle2 size={18}/></>}
             </button>
           </form>
         </div>
       </div>
    </div>
  );
};

export default AdminLoanRepayment;