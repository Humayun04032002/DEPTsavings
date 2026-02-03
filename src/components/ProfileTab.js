import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Info, Hash, Phone, MapPin, LogOut, 
  Lock, KeyRound, CheckCircle, ShieldAlert, Sparkles, Settings, Camera
} from 'lucide-react';
import { auth } from '../firebase/config';
import { updatePassword } from 'firebase/auth';

const ProfileTab = ({ user }) => {
  const [newPass, setNewPass] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // প্রোফাইল পিকচার স্টেট (প্রথমে লোকাল স্টোরেজ থেকে চেক করবে)
  const [profileImg, setProfileImg] = useState(localStorage.getItem('user_photo') || null);

  const [darkMode] = useState(localStorage.getItem('theme') === 'dark');

  // ছবি সিলেক্ট এবং লোকাল স্টোরেজে সেভ করার ফাংশন
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImg(base64String);
        localStorage.setItem('user_photo', base64String); // লোকাল স্টোরেজে সেভ
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) return setMessage({ text: 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে', type: 'error' });
    
    setIsChanging(true);
    try {
      await updatePassword(auth.currentUser, newPass);
      setMessage({ text: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!', type: 'success' });
      setNewPass('');
    } catch (err) {
      setMessage({ text: 'আবার লগইন করে চেষ্টা করুন', type: 'error' });
    }
    setIsChanging(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const ProfileItem = ({ icon, label, value }) => (
    <div className={`flex items-center gap-4 py-5 border-b last:border-0 ${darkMode ? 'border-white/5' : 'border-slate-50'}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
        darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black opacity-40 uppercase mb-0.5 tracking-widest">{label}</p>
        <p className={`text-[15px] font-bold tracking-tight ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
            {value || '---'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slideUp pb-32">
      
      {/* ১. প্রিমিয়াম প্রোফাইল হেডার */}
      <div className={`p-8 rounded-[3.5rem] shadow-2xl border relative overflow-hidden transition-all duration-500 ${
        darkMode ? 'bg-slate-900/50 border-white/5' : 'bg-white border-white shadow-slate-200/50'
      }`}>
         <div className="relative z-10">
            <div className="flex justify-center mb-6">
                <div className={`relative p-1 rounded-[2.5rem] border-2 border-dashed ${darkMode ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
                    <div className={`w-28 h-28 rounded-[2.2rem] overflow-hidden flex items-center justify-center border-4 ${
                        darkMode ? 'bg-slate-800 border-slate-900' : 'bg-emerald-50 border-white shadow-xl'
                    }`}>
                        {profileImg ? (
                          <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck size={56} className="text-emerald-500" />
                        )}
                    </div>
                    
                    {/* ক্যামেরা বাটন (ছবি চেঞ্জ করার জন্য) */}
                    <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg cursor-pointer active:scale-90 transition-all">
                        <Camera size={18} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                </div>
            </div>
            
            <div className="text-center">
                <h3 className={`text-3xl font-black italic tracking-tighter mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    {user?.name}
                </h3>
                <div className="flex justify-center">
                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] border border-emerald-500/20 flex items-center gap-2">
                        <Sparkles size={12} /> Verified Member
                    </span>
                </div>
            </div>

            {/* প্রোফাইল ডিটেইলস */}
            <div className="mt-10 space-y-1">
                <ProfileItem icon={<Info size={20}/>} label="পিতার নাম" value={user?.fatherName} />
                <ProfileItem icon={<Hash size={20}/>} label="রেজিস্ট্রেশন নং" value={user?.regNo} />
                <ProfileItem icon={<Phone size={20}/>} label="মোবাইল নম্বর" value={user?.phone} />
                <ProfileItem icon={<MapPin size={20}/>} label="বর্তমান ঠিকানা" value={user?.address} />
            </div>
         </div>
      </div>

      {/* ২. সিকিউরিটি সেকশন */}
      <div className={`p-8 rounded-[3.5rem] border-2 transition-all duration-500 ${
        darkMode ? 'bg-slate-900/30 border-white/5' : 'bg-white border-white shadow-xl shadow-slate-200/50'
      }`}>
        <div className="flex items-center justify-between mb-8">
            <h4 className="text-[11px] font-black flex items-center gap-2 uppercase tracking-[0.2em] opacity-50">
                <Settings size={16} className="text-indigo-500" /> Security Settings
            </h4>
            <Lock size={18} className="opacity-20" />
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="relative group">
            <input 
              type="password" 
              placeholder="নতুন পাসওয়ার্ড লিখুন" 
              className={`w-full p-6 rounded-[1.8rem] text-sm font-bold border-2 outline-none transition-all ${
                darkMode 
                ? 'bg-white/5 border-transparent focus:border-indigo-500 text-white' 
                : 'bg-slate-50 border-transparent focus:border-indigo-200 text-slate-900'
              }`}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <KeyRound className="absolute right-6 top-6 opacity-20 group-focus-within:opacity-100 transition-opacity text-indigo-500" size={20} />
          </div>
          
          {message.text && (
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider animate-bounceIn ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
            }`}>
              {message.type === 'success' ? <CheckCircle size={16}/> : <ShieldAlert size={16}/>}
              {message.text}
            </div>
          )}

          <button 
            type="submit"
            disabled={isChanging || !newPass}
            className={`w-full py-6 rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${
                !newPass 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white shadow-indigo-500/40 hover:bg-indigo-700'
            }`}
          >
            {isChanging ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
          </button>
        </form>
      </div>

      {/* ৩. লগআউট সেকশন */}
      <button 
        onClick={() => auth.signOut()} 
        className={`w-full py-7 rounded-[3rem] font-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
            darkMode 
            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' 
            : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'
        }`}
      >
        <LogOut size={20} /> অ্যাপ থেকে লগআউট করুন
      </button>

      <div className="text-center space-y-2 py-4">
        <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em]">Digital Somiti Platform</p>
        <p className="text-[9px] font-bold opacity-10 uppercase tracking-widest">Build Version 2.0.4 • Stable</p>
      </div>
    </div>
  );
};

export default ProfileTab;