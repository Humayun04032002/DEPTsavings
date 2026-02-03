import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Download, ArrowLeft, Loader2, Calendar, TrendingUp, Filter, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminReports = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "deposits"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        formattedDate: doc.data().createdAt?.toDate().toLocaleDateString('en-GB') || 'N/A'
      }));
      setDeposits(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDeposits = deposits.filter(d => {
    if (!startDate && !endDate) return true;
    const dDate = d.createdAt?.toDate();
    if (!dDate) return false;
    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999); 
    return dDate >= start && dDate <= end;
  });

  const totalAmount = filteredDeposits
    .filter(d => d.status === 'approved')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const downloadPDF = async () => {
    if (filteredDeposits.length === 0) return alert("রিপোর্টে কোনো ডাটা নেই!");
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("COLLECTION REPORT", 14, 25);
    
    autoTable(doc, {
      head: [["Member Name", "Amount", "Method", "Status", "Date"]],
      body: filteredDeposits.map(d => [d.memberName, d.amount, d.method || "Cash", d.status, d.formattedDate]),
      startY: 50,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans overflow-x-hidden">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="font-black text-slate-800 text-lg tracking-tight uppercase">রিপোর্ট বোর্ড</h1>
          <div className="w-10"></div> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* Hero Section / Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} className="text-blue-600" /> ফিল্টার অপশন
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 ml-1">শুরুর তারিখ</span>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 ml-1">শেষ তারিখ</span>
                <input 
                  type="date" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-200 flex flex-col justify-center relative overflow-hidden">
            <TrendingUp className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">মোট সংগ্রহ</p>
            <h3 className="text-3xl font-black italic">৳{totalAmount.toLocaleString('bn-BD')}</h3>
            <button 
              onClick={downloadPDF}
              className="mt-6 bg-white/20 backdrop-blur-md border border-white/30 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> PDF ডাউনলোড
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                <th className="px-8 py-5">সদস্যের নাম</th>
                <th className="px-8 py-5">পরিমাণ</th>
                <th className="px-8 py-5">তারিখ</th>
                <th className="px-8 py-5 text-right">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredDeposits.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-700">{d.memberName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{d.method || 'Cash'}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-900 italic">৳{Number(d.amount).toLocaleString('bn-BD')}</td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-500">{d.formattedDate}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      d.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>
                      {d.status === 'approved' ? 'গৃহীত' : 'পেন্ডিং'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
             <Search size={14} /> লেনদেন তালিকা ({filteredDeposits.length})
          </h3>
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
          ) : filteredDeposits.map((d) => (
            <div key={d.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
               <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-slate-800 leading-tight">{d.memberName}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{d.formattedDate} • {d.method || 'Cash'}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${
                      d.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {d.status === 'approved' ? 'সফল' : 'বাকি'}
                  </span>
               </div>
               <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">পরিমাণ</span>
                  <span className="font-black text-slate-900 italic text-lg">৳{Number(d.amount).toLocaleString('bn-BD')}</span>
               </div>
            </div>
          ))}
        </div>

        {!loading && filteredDeposits.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 mt-4">
             <FileText className="mx-auto text-slate-200 mb-4" size={48} />
             <p className="text-slate-400 font-bold italic">কোনো তথ্য পাওয়া যায়নি!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;