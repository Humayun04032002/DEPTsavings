import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
// ১. মেইন অ্যাপ ইনিশিয়ালাইজেশন
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ২. সেকেন্ডারি অ্যাপ
const secondaryApp = getApps().find(a => a.name === 'Secondary') 
  || initializeApp(firebaseConfig, 'Secondary');

export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);

// ৩. ফায়ারবেস ডাটাবেস (অ্যাডভান্সড সেটিংস)
export const db = initializeFirestore(app, {
    // এটি নেটওয়ার্কের 'Unexpected State' এরর কমাবে
    experimentalForceLongPolling: true, 
    
    // ইন্টারনাল এরর এড়াতে মেমরি ক্যাশ ব্যবহার করাই সবচেয়ে নিরাপদ
    localCache: memoryLocalCache(), 
});