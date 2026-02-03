import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/config';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import Navbar from './Navbar';
import HomeTab from './HomeTab';
import SomitiTab from './SomitiTab';
import ProfileTab from './ProfileTab';
import NotificationPopup from './NotificationPopup';

const MemberDashboard = () => {
  const [appTab, setAppTab] = useState(0); 
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [user, setUser] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  
  const sessionStartTime = useRef(Date.now());

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const unsubUser = onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
      if (doc.exists()) setUser(doc.data());
    });

    const qNotice = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(1));
    const unsubNotice = onSnapshot(qNotice, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const noticeTime = data.createdAt?.toMillis() || 0;
        if (noticeTime > sessionStartTime.current) {
          showPopup({ message: data.message, type: 'notice' });
        }
      }
    });

    const qPayment = query(
      collection(db, "deposits"), 
      where("userId", "==", currentUser.uid),
      where("status", "==", "approved"),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const unsubPayment = onSnapshot(qPayment, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const paymentTime = data.timestamp?.toMillis() || 0;
        if (paymentTime > sessionStartTime.current) {
          showPopup({
            message: `অভিনন্দন! আপনার ৳${data.amount.toLocaleString()} জমা অ্যাপ্রুভ হয়েছে।`,
            type: 'success'
          });
        }
      }
    });

    return () => { unsubUser(); unsubNotice(); unsubPayment(); };
  }, []);

  const showPopup = (notif) => {
    setActiveNotification(notif);
    setTimeout(() => setActiveNotification(null), 5000);
  };

  // ডার্ক মোড এবং গ্লোবাল বডি স্টাইল ফিক্স
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-700 
      ${darkMode ? 'bg-[#020617]' : 'bg-[#F1F5F9]'}`}>
      
      {/* ব্যাকগ্রাউন্ড ডেকোরেশন (Glossy Orbs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* মেইন কন্টেন্ট এরিয়া */}
      <div className="h-full overflow-y-auto pb-32 scroll-smooth relative z-10">
        <Navbar 
          user={user} 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          appTab={appTab} 
          setAppTab={setAppTab} 
        />

        <div className="max-w-xl mx-auto px-5 -mt-10 relative z-20">
          <main className="transition-all duration-500 ease-in-out transform">
            <div key={appTab} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {appTab === 0 && <HomeTab user={user} darkMode={darkMode} />}
              {appTab === 1 && <SomitiTab darkMode={darkMode} />}
              {appTab === 2 && <ProfileTab user={user} darkMode={darkMode} />}
            </div>
          </main>
        </div>
      </div>

      {/* পপআপ নোটিফিকেশন */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-none flex justify-center p-6">
        <NotificationPopup 
          notification={activeNotification} 
          darkMode={darkMode} 
          onClose={() => setActiveNotification(null)}
        />
      </div>

      {/* কাস্টম গ্লোবাল স্টাইল */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 0px; }
        .glass-card {
          background: ${darkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.8)'};
          backdrop-filter: blur(12px);
          border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }
      `}</style>
    </div>
  );
};

export default MemberDashboard;