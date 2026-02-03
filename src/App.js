import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Pages
import Login from './pages/Login';
import MemberDashboard from './components/MemberDashboard'; 
import NoticeBoard from './components/NoticeBoard'; 
import TransactionHistory from './components/TransactionHistory'; 
import RegisterLink from './pages/RegisterLink'; 
import AdminDashboard from './pages/AdminDashboard';
import AdminAddMember from './pages/AdminAddMember';
import AdminMemberList from './pages/AdminMemberList';
import AdminApprovals from './pages/AdminApprovals';
import MemberDetails from './pages/MemberDetails'; 
import AdminAddLoan from './pages/AdminAddLoan';
import AdminNotice from './pages/AdminNotice'; 
import AdminLoanRepayment from './pages/AdminLoanRepayment';
import AdminReports from './pages/AdminReports';
import AdminAddStaff from './pages/AdminAddStaff';
import AdminActivityLog from './pages/AdminActivityLog';

/**
 * প্রোটেক্টেড রুট ফাংশন
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">অপেক্ষা করুন...</p>
        </div>
      </div>
    );
  }

  // ১. লগইন না থাকলে লগইন পেজে পাঠান
  if (!user) return <Navigate to="/login" replace />;

  // ২. ডাটা না থাকলে এরর দেখান
  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-xl font-bold text-red-500 mb-2">ইউজার প্রোফাইল পাওয়া যায়নি!</h2>
        <button onClick={() => window.location.reload()} className="bg-emerald-600 text-white px-6 py-2 rounded-xl shadow-lg">রিফ্রেশ</button>
      </div>
    );
  }

  // অ্যাডমিন বা ক্যাশিয়ার কিনা চেক
  const isAdminOrCashier = userData.role === 'admin' || userData.role === 'cashier';

  // ৩. অ্যাডমিন রুটে অ্যাক্সেস কন্ট্রোল (ক্যাশিয়ারকেও অনুমতি দেওয়া হয়েছে)
  if (role === 'admin' && !isAdminOrCashier) {
    return <Navigate to="/" replace />;
  }

  // ৪. মেম্বার রুটে যদি অ্যাডমিন/ক্যাশিয়ার ঢুকতে চায়, তবে তাদের অ্যাডমিন প্যানেলে পাঠিয়ে দিন
  if (role === 'member' && isAdminOrCashier) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

/**
 * লগইন পেজের জন্য রুট লজিক
 */
const LoginRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) return null;
  
  if (user && userData) {
    // লগইন করা থাকলে রোল অনুযায়ী ড্যাশবোর্ডে পাঠিয়ে দিবে
    const isAdminOrCashier = userData.role === 'admin' || userData.role === 'cashier';
    return <Navigate to={isAdminOrCashier ? "/admin" : "/"} replace />;
  }
  return children;
};

// --- রিয়েল-টাইম নোটিফিকেশন লিসেনার ---
const NotificationHandler = () => {
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user || !userData) return;

    if (userData.role === 'admin' || userData.role === 'cashier') {
      const q = query(collection(db, "deposits"), where("status", "==", "pending"));
      const unsubscribeAdmin = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            if (Notification.permission === "granted") {
              new Notification("নতুন জমার আবেদন!", {
                body: `${data.userName} ৳${data.amount} জমা দিয়েছেন।`,
              });
            }
          }
        });
      });
      return () => unsubscribeAdmin();
    }

    if (userData.role === 'member') {
      const q = query(collection(db, "deposits"), where("userId", "==", user.uid));
      const unsubscribeUser = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const data = change.doc.data();
            if (data.status === "approved") {
              if (Notification.permission === "granted") {
                new Notification("জমা সফল হয়েছে! ✅", {
                  body: `আপনার ৳${data.amount} জমা এপ্রুভ করা হয়েছে।`,
                });
              }
            }
          }
        });
      });
      return () => unsubscribeUser();
    }

    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [user, userData]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationHandler /> 
        <Routes>
          <Route path="/login" element={<LoginRoute><Login /></LoginRoute>} />
          <Route path="/join" element={<RegisterLink />} />

          {/* Member Routes */}
          <Route path="/" element={<ProtectedRoute role="member"><MemberDashboard /></ProtectedRoute>} />
          <Route path="/notices" element={<ProtectedRoute role="member"><NoticeBoard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute role="member"><TransactionHistory /></ProtectedRoute>} />

          {/* Admin Routes (Cashier ও এই রুটে ঢুকতে পারবে) */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/add-member" element={<ProtectedRoute role="admin"><AdminAddMember /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute role="admin"><AdminMemberList /></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><AdminApprovals /></ProtectedRoute>} />
          <Route path="/admin/member/:id" element={<ProtectedRoute role="admin"><MemberDetails /></ProtectedRoute>} />
          <Route path="/admin/add-loan" element={<ProtectedRoute role="admin"><AdminAddLoan /></ProtectedRoute>} />
          <Route path="/admin/loan-repayment" element={<ProtectedRoute role="admin"><AdminLoanRepayment /></ProtectedRoute>} />
          <Route path="/admin/notice" element={<ProtectedRoute role="admin"><AdminNotice /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/staff" element={<ProtectedRoute role="admin"><AdminAddStaff /></ProtectedRoute>} />
          <Route path="/admin/activity-logs" element={<ProtectedRoute role="admin"><AdminActivityLog /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;