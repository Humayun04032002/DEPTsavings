import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Pages (আপনার আগের সব ইমপোর্ট এখানে থাকবে)
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
 * প্রোটেক্টেড রুট ফাংশন (আগের মতোই আছে)
 */
const ProtectedRoute = ({ children, role }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen bg-white">অপেক্ষা করুন...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!userData) return <div>ইউজার প্রোফাইল পাওয়া যায়নি!</div>;

  const isAdminOrCashier = userData.role === 'admin' || userData.role === 'cashier';
  if (role === 'admin' && !isAdminOrCashier) return <Navigate to="/" replace />;
  if (role === 'member' && isAdminOrCashier) return <Navigate to="/admin" replace />;
  return children;
};

/**
 * লগইন রুট (আগের মতোই আছে)
 */
const LoginRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return null;
  if (user && userData) {
    const isAdminOrCashier = userData.role === 'admin' || userData.role === 'cashier';
    return <Navigate to={isAdminOrCashier ? "/admin" : "/"} replace />;
  }
  return children;
};

// --- আপডেট করা নোটিফিকেশন হ্যান্ডলার ---
const NotificationHandler = () => {
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user || !userData) return;

    // অ্যান্ডরয়েড স্টুডিও এবং ব্রাউজার নোটিফিকেশন ট্রিগার করার মেইন ফাংশন
    const sendNotification = (title, body) => {
      // ১. চেক করবে এটি অ্যান্ডরয়েড অ্যাপ (WebView) কি না
      if (window.Android && window.Android.showNotification) {
        window.Android.showNotification(title, body);
      } 
      // ২. ব্রাউজারের সাধারণ নোটিফিকেশন (যদি পিসিতে থাকে)
      else if (Notification.permission === "granted") {
        new Notification(title, { body: body });
      }
    };

    // অ্যাডমিন/ক্যাশিয়ারের জন্য লিসেনার
    if (userData.role === 'admin' || userData.role === 'cashier') {
      const q = query(collection(db, "deposits"), where("status", "==", "pending"));
      const unsubscribeAdmin = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            sendNotification("নতুন জমার আবেদন!", `${data.userName} ৳${data.amount} জমা দিয়েছেন।`);
          }
        });
      });
      return () => unsubscribeAdmin();
    }

    // মেম্বারদের জন্য লিসেনার
    if (userData.role === 'member') {
      const q = query(collection(db, "deposits"), where("userId", "==", user.uid));
      const unsubscribeUser = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const data = change.doc.data();
            if (data.status === "approved") {
              sendNotification("জমা সফল হয়েছে! ✅", `আপনার ৳${data.amount} জমা এপ্রুভ করা হয়েছে।`);
            } else if (data.status === "rejected") {
              sendNotification("আবেদন বাতিল! ❌", `আপনার ৳${data.amount} জমার আবেদনটি বাতিল করা হয়েছে।`);
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

          {/* Admin Routes */}
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