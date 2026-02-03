import React, { useState, useEffect } from 'react';
import { db, secondaryAuth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { 
  doc, setDoc, addDoc, collection, serverTimestamp, 
  query, where, onSnapshot 
} from 'firebase/firestore';
import { 
  Shield, Lock, ArrowLeft, Loader2, Phone, UserCheck, 
  Eye, EyeOff, CheckCircle2, UserRound, Trash2, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAddStaff = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'cashier'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // স্টাফ লিস্টের জন্য স্টেট
  const [staffList, setStaffList] = useState([]);
  const [listLoading, setListLoading] = useState(true);

  // ১. রিয়েল-টাইম স্টাফ লিস্ট ফেচ করা
  useEffect(() => {
    const q = query(
      collection(db, "users"), 
      where("role", "in", ["admin", "cashier"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStaffList(staff);
      setListLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddStaff = async (e) => {
    e.preventDefault();

    if (formData.phone.length < 11) {
      alert("সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)");
      return;
    }
    if (formData.password.length < 6) {
      alert("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    setLoading(true);
    const virtualEmail = `${formData.phone}@somity.com`;

    try {
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, virtualEmail, formData.password);
      
      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        phone: formData.phone,
        email: virtualEmail,
        role: formData.role,
        uid: user.uid,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Main Admin",
        action: "স্টাফ নিয়োগ",
        details: `${formData.name} (নম্বর: ${formData.phone})-কে ${formData.role === 'admin' ? 'অ্যাডমিন' : 'ক্যাশিয়ার'} করা হয়েছে।`,
        timestamp: serverTimestamp(),
        type: "security"
      });

      await signOut(secondaryAuth);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000); // ৩ সেকেন্ড পর ফর্ম আবার দেখাবে
    } catch (err) {
      let errorMessage = "ভুল হয়েছে: " + err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "এই নম্বরটি দিয়ে ইতিমধ্যে অ্যাকাউন্ট খোলা হয়েছে।";
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-emerald-50 border border-emerald-200">
          <CheckCircle2 size={50} className="animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">নিয়োগ সফল!</h2>
        <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">অ্যাকাউন্ট তৈরি হয়েছে: {formData.phone}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => navigate('/admin')} className="p-3 bg-slate-100 text-slate-600 rounded-2xl active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Staff Management</h1>
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Shield size={20} /></div>
      </div>

      <div className="max-w-2xl mx-auto p-6 mt-4">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* লেফট সাইড: ফর্ম */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl">
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Add Staff</h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">মোবাইল নম্বর দিয়ে স্টাফ যোগ করুন</p>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">পুরো নাম</label>
                <input type="text" placeholder="স্টাফের নাম" required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">মোবাইল নম্বর</label>
                <input type="tel" placeholder="017XXXXXXXX" required maxLength={11} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">পাসওয়ার্ড</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" required className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">এক্সেস লেভেল</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, role: 'cashier'})} className={`p-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${formData.role === 'cashier' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-400'}`}>Cashier</button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'admin'})} className={`p-3 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${formData.role === 'admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'}`}>Admin</button>
                </div>
              </div>

              <button disabled={loading} className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black shadow-xl flex justify-center items-center gap-2 hover:bg-blue-600 active:scale-95 disabled:opacity-50 tracking-widest text-[10px] uppercase">
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirm Appointment"}
              </button>
            </form>
          </div>

          {/* রাইট সাইড: স্টাফ লিস্ট */}
          <div className="space-y-6">
            <div className="bg-indigo-600 rounded-[2.5rem] p-6 shadow-xl">
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Current Staff</h2>
              <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest mt-1">সিস্টেম অ্যাডমিন ও ক্যাশিয়ার বৃন্দ</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
                {listLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : staffList.length > 0 ? (
                  staffList.map((staff) => (
                    <div key={staff.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[1.8rem] border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${staff.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                          <UserRound size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 leading-tight">{staff.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter ${staff.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
                              {staff.role}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5"><Phone size={10}/> {staff.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-slate-400 text-xs font-bold italic">কোনো স্টাফ পাওয়া যায়নি</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminAddStaff;