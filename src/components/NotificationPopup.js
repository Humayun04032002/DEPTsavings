import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, X } from 'lucide-react';

const NotificationPopup = ({ notification, darkMode }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification && notification.message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!visible || !notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed top-20 left-6 right-6 z-[100] animate-bounceIn max-w-sm mx-auto">
      <div className={`relative p-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border-2 ${
        darkMode ? 'bg-slate-900 border-indigo-500/30 text-white' : 'bg-white border-indigo-50 text-slate-900'
      }`}>
        <button onClick={() => setVisible(false)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><X size={16}/></button>
        
        <div className={`p-3 rounded-2xl shadow-lg ${isSuccess ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
          {isSuccess ? <CheckCircle2 size={24} className="text-white"/> : <Bell size={24} className="text-white animate-swing"/>}
        </div>

        <div className="flex-1 pr-4">
          <p className={`text-[9px] font-black uppercase tracking-widest ${isSuccess ? 'text-emerald-500' : 'text-indigo-500'}`}>
            {isSuccess ? 'পেমেন্ট আপডেট' : 'নতুন নোটিশ'}
          </p>
          <p className="text-[12px] font-bold leading-tight italic">
            {notification.message} {/* এখানে message ব্যবহার করা হয়েছে */}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes bounceIn { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes swing { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(15deg); } 75% { transform: rotate(-15deg); } }
        .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-swing { animation: swing 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default NotificationPopup;