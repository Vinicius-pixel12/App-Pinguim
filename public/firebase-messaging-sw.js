/* Service worker de push (Firebase Cloud Messaging).
   As chaves abaixo são públicas por design. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

self.addEventListener("message", (event) => {
  const config = event.data && event.data.firebaseConfig;
  if (!config || firebase.apps.length) return;
  firebase.initializeApp(config);
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const n = payload.notification || {};
    self.registration.showNotification(n.title || "Pinguim", {
      body: n.body || "",
      icon: "/favicon.ico",
      data: { clickPath: (payload.data && payload.data.clickPath) || "/notificacoes" },
    });
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.clickPath) || "/";
  event.waitUntil(clients.openWindow(path));
});
