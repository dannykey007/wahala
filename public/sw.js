/* eslint-disable no-restricted-globals */
// public/sw.js
// This file runs in the background of the phone/computer even if the app is closed

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    const { text, delay } = event.data;

    // Schedule an OS-level alarm using a timeout that runs in the service worker context
    setTimeout(() => {
      self.registration.showNotification('⏰ Task Reminder!', {
        body: text,
        icon: '/logo192.png',
        vibrate: [200, 100, 200], // Sets a working vibration duration
        requireInteraction: true
      });
    }, delay);
  }
});