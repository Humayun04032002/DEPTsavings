const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// ১. এডমিনকে নোটিফিকেশন পাঠানো (ইউজার টাকা জমা দিলে)
exports.onDepositAdded = functions.firestore
    .document('deposits/{id}')
    .onCreate(async (snap) => {
        const data = snap.data();
        const payload = {
            notification: {
                title: 'নতুন জমার আবেদন! 💰',
                body: `${data.userName} ৳${data.amount} জমা দিয়েছেন।`,
            }
        };
        // এডমিন টপিকে মেসেজ পাঠানো
        return admin.messaging().sendToTopic('admin_notifications', payload);
    });

// ২. ইউজারকে নোটিফিকেশন পাঠানো (এডমিন এপ্রুভ করলে)
exports.onDepositApproved = functions.firestore
    .document('deposits/{id}')
    .onUpdate(async (change) => {
        const after = change.after.data();
        const before = change.before.data();

        // যদি স্ট্যাটাস pending থেকে approved হয়
        if (before.status === 'pending' && after.status === 'approved') {
            const payload = {
                notification: {
                    title: 'জমা সফল হয়েছে! ✅',
                    body: `আপনার ৳${after.amount} জমা এপ্রুভ করা হয়েছে।`,
                }
            };
            return admin.messaging().sendToTopic(`user_${after.userId}`, payload);
        }
    });