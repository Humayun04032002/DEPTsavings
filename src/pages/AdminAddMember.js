import React, { useState, useEffect } from 'react';
import { db, secondaryAuth } from '../firebase/config';
import { useAuth } from '../context/AuthContext'; 
import { setDoc, doc, addDoc, collection, onSnapshot, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, ArrowLeft, Loader2, Phone, Lock, User, 
  CreditCard, Hash, Users, Clock, CheckCircle, Trash2, Copy, Target, Sparkles, AlertCircle, Info, Eye, EyeOff
} from 'lucide-react';

const AdminAddMember = () => {
  const navigate = useNavigate();
  const { userData } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', phone: '', password: '', fatherName: '', regNo: '', nid: '', monthlyTarget: '' 
  });

  const registrationLink = `${window.location.origin}/join`;

  const copyLink = () => {
    const textToCopy = registrationLink;

    // ১. আধুনিক ব্রাউজার ও সিকিউর কনটেক্সট (HTTPS/Localhost) এর জন্য
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch((err) => console.error('Clipboard copy failed:', err));
    } else {
      // ২. মোবাইল বা আইপি (HTTP) এর জন্য Fallback পদ্ধতি
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        
        // টেক্সট এরিয়াটি স্ক্রিনের বাইরে হাইড করে রাখা
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
        alert("লিঙ্কটি কপি করা যায়নি। ম্যানুয়ালি কপি করুন।");
      }
    }
  };

  useEffect(() => {
    const q = query(collection(db, "memberRequests"), where("status", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      setRequestLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setRequestLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (req) => {
    if (!window.confirm(`${req.name}-কে মেম্বার হিসেবে গ্রহণ করতে চান?`)) return;
    setLoading(true);
    const fakeEmail = `${req.phone}@somity.com`;

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, req.password);
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        name: req.name,
        email: fakeEmail,
        phone: req.phone,
        fatherName: req.fatherName,
        regNo: req.regNo || `M-${Date.now().toString().slice(-4)}`,
        nid: req.nid || '',
        monthlyTarget: Number(req.monthlyTarget) || 0,
        role: "member",
        totalSavings: 0,
        uid: newUser.uid,
        status: 'active',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Admin",
        action: "রিকোয়েস্ট এপ্রুভ",
        details: `${req.name} (${req.phone}) এখন মেম্বার। মাসিক লক্ষ্য: ৳${req.monthlyTarget}`,
        timestamp: serverTimestamp(),
        type: "success"
      });

      await deleteDoc(doc(db, "memberRequests", req.id));
      await signOut(secondaryAuth);
      alert("মেম্বার এপ্রুভ সফল!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAdd = async (e) => {
    e.preventDefault();
    if(formData.phone.length < 11) return alert("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন!");
    if(formData.password.length < 6) return alert("পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে!");
    
    setLoading(true);
    const fakeEmail = `${formData.phone}@somity.com`;

    try {
      const { user } = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, formData.password);
      const memberRegNo = formData.regNo || `M-${Math.floor(1000 + Math.random() * 9000)}`;

      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        regNo: memberRegNo,
        email: fakeEmail,
        monthlyTarget: Number(formData.monthlyTarget) || 0,
        role: "member",
        totalSavings: 0,
        uid: user.uid,
        status: 'active',
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "logs"), {
        adminName: userData?.name || "Admin",
        action: "সরাসরি অ্যাড",
        details: `${formData.name} (${formData.phone}) মেম্বার হিসেবে যুক্ত।`,
        timestamp: serverTimestamp(),
        type: "success"
      });

      await signOut(secondaryAuth);
      alert("মেম্বারশিপ তৈরি হয়েছে!");
      navigate('/admin/members');
    } catch (err) {
      alert(err.code === 'auth/email-already-in-use' ? "এই নম্বর দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে!" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin')} className="p-3 bg-white text-slate-600 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-90">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">Member Registry</h1>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Add & Approve Members</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 w-full sm:w-auto overflow-hidden">
               <Info size={14} className="text-blue-400 shrink-0" />
               <span className="text-[11px] font-bold text-blue-700 truncate">{registrationLink}</span>
            </div>
            <button onClick={copyLink} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg ${copied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200'}`}>
               {copied ? <CheckCircle size={16}/> : <Copy size={16}/>}
               {copied ? "COPIED!" : "COPY JOIN LINK"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Form Side */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white sticky top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-blue-100">
                  <UserPlus size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">সরাসরি নিবন্ধন</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">নতুন মেম্বার ডাটা ইনপুট দিন</p>
                </div>
              </div>

              <form onSubmit={handleDirectAdd} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="মেম্বার নাম" icon={<User size={12}/>} placeholder="আব্দুর রহমান" onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    <InputField label="পিতার নাম" icon={<Users size={12}/>} placeholder="বাবার নাম" onChange={(e) => setFormData({...formData, fatherName: e.target.value})} required />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="REG NO" icon={<Hash size={12}/>} placeholder="ঐচ্ছিক (M-101)" onChange={(e) => setFormData({...formData, regNo: e.target.value})} />
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-500 uppercase ml-2 flex items-center gap-1"><Target size={10}/> মাসিক লক্ষ্য (৳)</label>
                      <input 
                        type="number" 
                        placeholder="যেমন: 300" 
                        required
                        className="w-full p-4 bg-blue-50/50 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all font-black text-blue-700" 
                        onChange={(e) => setFormData({...formData, monthlyTarget: e.target.value})} 
                      />
                    </div>
                  </div>

                  <InputField label="মোবাইল নম্বর" icon={<Phone size={12}/>} placeholder="017XXXXXXXX" type="tel" maxLength="11" onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                  
                  <div className="relative">
                    <InputField label="লগইন পাসওয়ার্ড" icon={<Lock size={12}/>} placeholder="৬ ডিজিট পাসওয়ার্ড" type={showPass ? "text" : "password"} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-10 text-slate-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-5 rounded-[1.5rem] font-black shadow-xl flex justify-center items-center gap-3 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 mt-4 uppercase text-xs tracking-widest">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18}/> Create Membership</>}
                  </button>
              </form>
            </div>
          </div>

          {/* List Side */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 italic px-2">
              <Clock className="text-orange-500 animate-pulse" /> Pending Requests 
              <span className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full not-italic">{requests.length}</span>
            </h2>

            {requestLoading ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">রিকোয়েস্ট লোড হচ্ছে...</p>
              </div>
            ) : requests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 text-slate-800 rounded-3xl flex items-center justify-center font-black text-2xl shadow-inner border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase italic">{req.name[0]}</div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg leading-tight">{req.name}</h4>
                          <p className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-1"><Phone size={10}/> {req.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                         <button onClick={() => handleApprove(req)} disabled={loading} className="flex-1 sm:flex-none bg-emerald-50 text-emerald-600 p-4 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all active:scale-90 border border-emerald-100">
                           <CheckCircle size={22} strokeWidth={3}/>
                         </button>
                         <button onClick={async () => { if(window.confirm("রিকোয়েস্টটি ডিলিট করতে চান?")) { await deleteDoc(doc(db, "memberRequests", req.id)); } }} className="flex-1 sm:flex-none p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90 border border-rose-100">
                           <Trash2 size={22} strokeWidth={3}/>
                         </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 bg-[#FBFDFF] p-5 rounded-3xl border border-blue-50">
                      <DetailBox label="পিতার নাম" value={req.fatherName} icon={<Users size={12}/>} />
                      <DetailBox label="মাসিক লক্ষ্য" value={`৳${req.monthlyTarget}`} icon={<Target size={12} className="text-blue-500"/>} />
                      <DetailBox label="NID নম্বর" value={req.nid || "N/A"} icon={<CreditCard size={12}/>} />
                      <DetailBox label="রেজিস্ট্রেশন" value={req.regNo || "AUTO"} icon={<Hash size={12}/>} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[3rem] text-center">
                <AlertCircle size={40} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black italic uppercase tracking-widest text-xs">No pending applications</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">{icon} {label}</label>
    <input 
      className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all font-bold text-slate-800 placeholder:text-slate-300" 
      {...props} 
    />
  </div>
);

const DetailBox = ({ label, value, icon }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 tracking-tighter opacity-70">{icon} {label}</p>
    <p className="text-sm font-black text-slate-800 truncate italic">{value}</p>
  </div>
);

export default AdminAddMember;