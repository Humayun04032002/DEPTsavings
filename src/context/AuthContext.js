import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // ডাটা ফেচিং শুরু হওয়ার আগে লোডিং ট্রু করে রাখা
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.warn("Firestore-এ ইউজার ডাটা পাওয়া যায়নি!");
            setUserData(null);
          }
        } catch (error) {
          console.error("ডাটাবেস থেকে ডাটা আনতে সমস্যা হয়েছে:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false); // সব কাজ শেষ হলে লোডিং ফলস
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);