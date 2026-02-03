import React, { useEffect, useState } from 'react';
import { UserCheck, ShieldCheck, Sun, Moon, Bell, History, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

const Navbar = ({ user, darkMode, setDarkMode, appTab, setAppTab }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("recipient", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className={`pt-14 pb-10 px-6 rounded-b-[4rem] shadow-2xl relative overflow-hidden transition-all duration-700 
      ${darkMode ? 'bg-[#064e3b]' : 'bg-emerald-600'}`}>
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>

      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[1.2rem] flex items-center justify-center border border-white/30 shadow-inner group overflow-hidden">
               {/* Shine Effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
               <UserCheck className="text-white drop-shadow-md" size={28} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-400 p-1 rounded-lg border-2 border-emerald-700">
               <Sparkles size={8} className="text-white" />
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-black text-white leading-tight tracking-tight italic">
              {user?.name || 'Loading...'}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="px-2 py-0.5 bg-black/20 backdrop-blur-md rounded-md border border-white/10 flex items-center gap-1">
                <ShieldCheck size={10} className="text-emerald-300" />
                <span className="text-white/80 text-[9px] font-black uppercase tracking-wider">
                  ID: {user?.regNo || '---'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Buttons with Glass Effect */}
          {[
            { icon: <History size={20} />, action: () => navigate('/history'), title: 'History' },
            { 
              icon: (
                <div className="relative">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-emerald-600 rounded-full animate-ping"></span>
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-emerald-600 rounded-full"></span>
                  )}
                </div>
              ), 
              action: () => navigate('/notices'), 
              title: 'Notices' 
            },
            { 
              icon: darkMode ? <Sun size={20} /> : <Moon size={20} />, 
              action: () => setDarkMode(!darkMode), 
              title: 'Mode' 
            }
          ].map((item, index) => (
            <button 
              key={index}
              onClick={item.action}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white active:scale-90 transition-all duration-300"
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Tab Switcher */}
      <div className="flex mt-10 bg-black/20 backdrop-blur-xl p-1.5 rounded-[1.8rem] relative h-16 items-center shadow-inner border border-white/5">
          {["হিসাব", "সমিতি", "প্রোফাইল"].map((title, idx) => (
            <button 
              key={idx} 
              onClick={() => setAppTab(idx)} 
              className={`flex-1 z-10 text-[12px] font-black transition-all duration-500 tracking-tighter
                ${appTab === idx ? 'text-emerald-900 drop-shadow-sm' : 'text-white/50 hover:text-white/80'}`}
            >
              {title}
            </button>
          ))}
          
          {/* Active Tab Indicator */}
          <div 
            className="absolute top-1.5 bottom-1.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-white rounded-[1.4rem] shadow-[0_8px_20px_rgba(255,255,255,0.3)]"
            style={{ 
              width: 'calc(33.33% - 8px)', 
              left: `calc(${appTab * 33.33}% + 4px)` 
            }}
          >
            {/* Subtle Inner Glow for Indicator */}
            <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-b from-white to-slate-100"></div>
          </div>
      </div>
    </div>
  );
};

export default Navbar;