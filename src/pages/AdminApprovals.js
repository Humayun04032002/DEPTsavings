import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; 
import { 
  collection, onSnapshot, query, where, doc, 
  runTransaction, addDoc, serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { Check, X, Clock, ArrowLeft, Loader2, CreditCard, Hash, Copy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminApprovals = () => {
  const { userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "deposits"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (requestId, userId, amount, memberName) => {
    if (!window.confirm(`${memberName}-এর ৳${amount} এপ্রুভ করতে চান?`)) return;
    
    setLoadingId(requestId);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, "users", userId);
        const depositRef = doc(db, "deposits", requestId);
        
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("ইউজার খুঁজে পাওয়া যায়নি!");

        const currentSavings = Number(userDoc.data().totalSavings || 0);
        
        transaction.update(userRef, {
          totalSavings: currentSavings + Number(amount)
        });

        transaction.update(depositRef, {
          status: "approved",
          approvedBy: userData?.name || "Admin",
          approvedAt: serverTimestamp()
        });

        const notifRef = doc(collection(db, "notifications"));
        transaction.set(notifRef, {
          title: "জমা সফল হয়েছে! ✅",
          body: `আপনার ৳${amount} জমার রিকোয়েস্ট এপ্রুভ করা হয়েছে।`,
          recipient: userId,
          read: false,
          createdAt: serverTimestamp(),
          type: 'success'
        });
      });

      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Admin",
        action: "জমা এপ্রুভাল",
        details: `${memberName}-এর ৳${amount} এপ্রুভ করা হয়েছে।`,
        timestamp: serverTimestamp(),
        type: "success"
      });
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId, userId, memberName, amount) => {
    const reason = window.prompt("রিজেক্ট করার কারণ লিখুন:");
    if (reason === null) return; 

    setLoadingId(requestId);
    try {
      const depositRef = doc(db, "deposits", requestId);
      await updateDoc(depositRef, {
        status: "rejected",
        rejectedBy: userData?.name || "Admin",
        rejectedAt: serverTimestamp(),
        rejectReason: reason || "No reason provided"
      });

      await addDoc(collection(db, "notifications"), {
        title: "আবেদন বাতিল ❌",
        body: `৳${amount} জমার আবেদনটি বাতিল করা হয়েছে। কারণ: ${reason || 'তথ্য অস্পষ্ট'}`,
        recipient: userId,
        read: false,
        createdAt: serverTimestamp(),
        type: 'error'
      });

      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Admin",
        action: "জমা রিজেক্ট",
        details: `${memberName}-এর ৳${amount} রিজেক্ট করা হয়েছে।`,
        timestamp: serverTimestamp(),
        type: "danger"
      });
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Dynamic Glass Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/admin')} className="p-3 bg-slate-100 text-slate-600 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em]">Deposit Queue</h1>
            <p className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full mt-1">
              {requests.length} Pending Actions
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto space-y-5">
        {requests.length === 0 ? (
          <div className="py-24 text-center">
            <div className="bg-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
              <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase italic">All Caught Up!</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">No pending deposits found</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Member Profile Section */}
              <div className="p-6 flex items-center gap-4">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner ${req.method === 'Bkash' ? 'bg-gradient-to-br from-pink-500 to-rose-600 text-white' : 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'}`}>
                  <CreditCard size={30} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-slate-900 text-lg leading-none truncate">{req.userName || req.memberName}</h3>
                    <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg shrink-0 ml-2">REG: {req.regNo}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                      <Clock size={12} className="text-blue-500" /> {req.timestamp?.toDate().toLocaleDateString('bn-BD')} | {req.timestamp?.toDate().toLocaleTimeString('bn-BD', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Detail Box */}
              <div className="mx-6 p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
                  <p className="font-mono font-black text-slate-700 text-sm tracking-tighter">{req.trxId}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(req.trxId, req.id)}
                  className={`p-3 rounded-2xl transition-all active:scale-90 ${copiedId === req.id ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 shadow-sm hover:text-blue-600'}`}
                >
                  {copiedId === req.id ? <Check size={18} strokeWidth={3} /> : <Copy size={18} />}
                </button>
              </div>

              {/* Payment Info & Action Row */}
              <div className="p-6 pt-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${req.method === 'Bkash' ? 'bg-pink-500' : 'bg-orange-500'}`}></span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.method} Payment</p>
                  </div>
                  <p className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">৳{req.amount}</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    disabled={loadingId === req.id}
                    onClick={() => handleReject(req.id, req.userId, req.userName || req.memberName, req.amount)}
                    className="w-14 h-14 flex items-center justify-center rounded-[1.2rem] bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90 disabled:opacity-50 shadow-sm border border-rose-100"
                  >
                    <X size={24} strokeWidth={3} />
                  </button>
                  <button 
                    disabled={loadingId === req.id}
                    onClick={() => handleApprove(req.id, req.userId, req.amount, req.userName || req.memberName)}
                    className="h-14 px-8 flex items-center justify-center gap-3 rounded-[1.2rem] bg-slate-900 text-white font-black hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200 uppercase text-xs tracking-widest"
                  >
                    {loadingId === req.id ? <Loader2 className="animate-spin" size={20} /> : <><Check size={20} strokeWidth={3} /> Approve</>}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminApprovals;