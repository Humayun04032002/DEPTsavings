import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, Download, History, Loader2, User, Phone, 
  CreditCard, Hash, Users, Target, Edit3, Check, TrendingUp, Sparkles
} from 'lucide-react';

const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let unsubscribeHistory;
    const fetchMemberData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMember(data);
          setNewTarget(data.monthlyTarget || 0);
        }

        const q = query(collection(db, "deposits"), where("userId", "==", id));
        unsubscribeHistory = onSnapshot(q, (snapshot) => {
          const fetchedHistory = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            rawDate: doc.data().timestamp?.toDate() || new Date()
          }));
          setHistory(fetchedHistory.sort((a, b) => b.rawDate - a.rawDate));
        });
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMemberData();
    return () => unsubscribeHistory && unsubscribeHistory();
  }, [id]);

  const downloadMemberPDF = () => {
    if (!member) return;
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("MEMBER STATEMENT", 14, 25);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.text(`Name: ${member.name}`, 14, 50);
    doc.text(`Total Savings: BDT ${Number(member.totalSavings || 0).toLocaleString()}`, 14, 64);
    
    const tableRows = history.map(h => [
      h.rawDate.toLocaleDateString('en-GB'),
      `BDT ${Number(h.amount).toLocaleString()}`,
      h.method || 'Cash',
      h.status.toUpperCase()
    ]);

    autoTable(doc, {
      head: [['Date', 'Amount', 'Method', 'Status']],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`${member.name}_Statement.pdf`);
  };

  const handleUpdateTarget = async () => {
    if (!newTarget || newTarget < 0) return;
    setUpdating(true);
    try {
      const docRef = doc(db, "users", id);
      await updateDoc(docRef, { monthlyTarget: Number(newTarget) });
      setMember(prev => ({ ...prev, monthlyTarget: Number(newTarget) }));
      setIsEditingTarget(false);
    } catch (error) {
      alert("Error updating target");
    } finally {
      setUpdating(false);
    }
  };

  const calculateProgress = () => {
    if (!member?.monthlyTarget || member.monthlyTarget === 0) return 0;
    const progress = (Number(member.totalSavings || 0) / Number(member.monthlyTarget)) * 100;
    return Math.min(progress, 100).toFixed(0);
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans relative overflow-hidden">
      
      {/* ১. আর্ট টেক্সচার এবং মেস ব্যাকগ্রাউন্ড */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}>
      </div>
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-blue-400/10 pointer-events-none z-0"></div>

      <div className="relative z-10">
        {/* Dynamic Header */}
        <div className="bg-slate-900 pt-8 pb-32 px-4 md:px-8 relative overflow-hidden">
            {/* Header Decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-10">
                <Sparkles size={150} className="text-white" />
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                    <ArrowLeft size={16} strokeWidth={3} /> ফিরে যান
                </button>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
                        <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-8 ring-white/5 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                            {member?.name ? member.name[0] : <User />}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{member?.name}</h1>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                <Hash size={12} /> মেম্বার আইডি: {member?.regNo || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 w-full md:w-auto text-center shadow-2xl">
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1 opacity-70">বর্তমান সঞ্চয় স্থিতি</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter">৳{Number(member?.totalSavings || 0).toLocaleString('bn-BD')}</h2>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-20 animate-slideUp">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Details (Glassy Card) */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl shadow-slate-200/50 border border-white">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
                    <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><User size={18} /></div> সদস্য তথ্য
                    </h3>
                    
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg w-full sm:w-auto justify-center group transition-all">
                        <Target size={18} className="text-blue-400" />
                        {isEditingTarget ? (
                        <div className="flex items-center gap-2">
                            <input autoFocus className="w-20 bg-transparent border-b-2 border-blue-500 outline-none font-black text-center text-sm" type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} />
                            <button onClick={handleUpdateTarget} className="text-emerald-400">{updating ? <Loader2 size={16} className="animate-spin"/> : <Check size={20} strokeWidth={3}/>}</button>
                        </div>
                        ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-tighter">লক্ষ্য: ৳{member?.monthlyTarget}</span>
                            <Edit3 size={16} className="cursor-pointer text-slate-400 hover:text-white transition-colors" onClick={() => setIsEditingTarget(true)} />
                        </div>
                        )}
                    </div>
                </div>

                {/* Progress Visual */}
                <div className="mb-12">
                    <div className="flex justify-between text-[11px] font-black uppercase text-slate-500 mb-3 px-1">
                        <span className="flex items-center gap-2"><TrendingUp size={14} className="text-blue-500"/> সঞ্চয় লক্ষ্যমাত্রা অগ্রগতি</span>
                        <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">{calculateProgress()}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner border border-slate-200/50">
                        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${calculateProgress()}%` }}>
                            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-12 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoItem icon={<Users size={20}/>} label="পিতার নাম" value={member?.fatherName} color="blue" />
                    <InfoItem icon={<Phone size={20}/>} label="ফোন নম্বর" value={member?.phone} color="emerald" />
                    <InfoItem icon={<CreditCard size={20}/>} label="NID নম্বর" value={member?.nid} color="orange" />
                    <InfoItem icon={<Check size={20}/>} label="সদস্য পদ" value="অফিশিয়াল সদস্য" color="violet" />
                </div>
                </div>

                {/* Transactions Table (Glassy) */}
                <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/30">
                    <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><History size={18} /></div> লেনদেনের বিবরণ
                    </h3>
                    <button onClick={downloadMemberPDF} className="h-12 w-12 flex items-center justify-center bg-white shadow-xl border border-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl transition-all text-slate-600 active:scale-90">
                        <Download size={20} />
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                        <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                            <th className="px-8 py-5">তারিখ ও মাধ্যম</th>
                            <th className="px-8 py-5">টাকার পরিমাণ</th>
                            <th className="px-8 py-5 text-right">অবস্থা</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {history.length > 0 ? history.map((item) => (
                            <tr key={item.id} className="group hover:bg-blue-50/40 transition-all">
                            <td className="px-8 py-6">
                                <p className="font-black text-slate-800 text-[15px]">{item.rawDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> {item.method || 'Cash Payment'}
                                </p>
                            </td>
                            <td className="px-8 py-6">
                                <span className="font-black text-slate-900 text-lg tracking-tighter italic">৳{Number(item.amount).toLocaleString('bn-BD')}</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <span className={`inline-flex px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                                    item.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                }`}>
                                    {item.status === 'approved' ? 'সফল' : 'পেন্ডিং'}
                                </span>
                            </td>
                            </tr>
                        )) : (
                            <tr>
                            <td colSpan="3" className="px-8 py-20 text-center text-slate-400 text-xs font-black italic uppercase tracking-widest opacity-30">কোনো লেনদেনের রেকর্ড পাওয়া যায়নি</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8 animate-slideInRight">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8 border-l-4 border-blue-500 pl-4">একনজরে রিপোর্ট</p>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">মোট কিস্তি</p>
                                    <p className="text-3xl font-black tracking-tighter mt-1">{history.length} <span className="text-xs uppercase text-slate-600 ml-1">বার</span></p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-blue-400"><History size={20}/></div>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">বকেয়া/পেন্ডিং</p>
                                    <p className="text-3xl font-black text-amber-500 tracking-tighter mt-1">{history.filter(h => h.status !== 'approved').length} <span className="text-xs uppercase text-slate-600 ml-1">বার</span></p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-amber-400"><Loader2 size={20}/></div>
                            </div>
                        </div>
                        <button 
                            onClick={downloadMemberPDF}
                            className="w-full mt-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Download size={16} strokeWidth={3} /> PDF Statement ডাউনলোড
                        </button>
                    </div>
                </div>

                <div className="bg-blue-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10 text-center space-y-2">
                        <Sparkles className="mx-auto mb-4 text-blue-200" size={32} />
                        <h4 className="text-sm font-black uppercase tracking-widest">প্রিমিয়াম মেম্বারশিপ</h4>
                        <p className="text-[10px] font-bold opacity-70">সদস্যের সকল ডাটা এনক্রিপ্টেড এবং সুরক্ষিত আছে।</p>
                    </div>
                </div>
            </div>

            </div>
        </div>
      </div>

      <style jsx>{`
        .animate-slideUp {
            animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .animate-slideInRight {
            animation: slideInRight 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.2s backwards;
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px); }
            to { opacity: 1; transform: translateX(0); }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

const InfoItem = ({ icon, label, value, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100"
  };
  
  return (
    <div className="flex items-center gap-5 p-5 bg-slate-50/40 rounded-[2rem] border border-transparent hover:border-slate-200 hover:bg-white transition-all group shadow-sm">
      <div className={`p-4 rounded-2xl border-2 transition-all group-hover:scale-110 group-hover:rotate-6 shadow-md ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-black text-slate-800 truncate text-[15px] italic">{value || 'অজানা'}</p>
      </div>
    </div>
  );
};

export default MemberDetails;