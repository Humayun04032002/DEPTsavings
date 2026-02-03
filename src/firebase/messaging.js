import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./config";

const messaging = getMessaging(app);

export const requestForToken = (userId, role) => {
  return getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_HERE' })
    .then((currentToken) => {
      if (currentToken) {
        console.log('Token generated');
        // Topic-e subscribe korar jonno token-ti backend-e pathate hoy
        // Admin hole 'admin_notifications' topic-e subscribe korbe
      }
    })
    .catch((err) => console.log('An error occurred while retrieving token. ', err));
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });