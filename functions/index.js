const functions = require("firebase-functions");
const admin = require("firebase-admin");

// আপনার ডাউনলোড করা JSON ফাইলটির পাথ এখানে দিন
// ফাইলটি 'functions' ফোল্ডারের ভেতরে রাখা ভালো
const serviceAccount = require("./somity-management-572db-a326063d8afc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.sendPushNotification = functions.firestore
    .document("notifications/{docId}")
    .onCreate(async (snap, context) => {
      const data = snap.data();
      const userId = data.recipient;

      try {
        // ইউজারের fcmToken খুঁজে বের করা
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        const fcmToken = userDoc.data()?.fcmToken;

        if (!fcmToken) {
          console.log("No token found for user:", userId);
          return null;
        }

        const message = {
          notification: {
            title: data.title || "নতুন আপডেট! ✅",
            body: data.body || "আপনার অ্যাপে একটি নতুন নোটিফিকেশন এসেছে।",
          },
          // আপনি চাইলে এখানে অ্যান্ড্রয়েড বা ওয়েবের জন্য আলাদা ডাটা যোগ করতে পারেন
          token: fcmToken,
        };

        // নোটিফিকেশন পাঠানো
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return response;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    });