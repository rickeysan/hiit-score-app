// Firebase Messaging Service Worker

// Firebase SDKをインポート（CDN版を使用）
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebaseの設定（firebase.jsと同じ設定を使用）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
}

// Firebaseの初期化
firebase.initializeApp(firebaseConfig)

// Messagingインスタンスの取得
const messaging = firebase.messaging()

// バックグラウンドメッセージの処理
messaging.onBackgroundMessage((payload) => {
  console.log('バックグラウンドメッセージを受信:', payload)
  
  const notificationTitle = payload.notification?.title || 'すきまフィット'
  const notificationOptions = {
    body: payload.notification?.body || '運動の時間です！',
    icon: '/work.mp4',
    badge: '/work.mp4',
    tag: 'hiit-notification',
    requireInteraction: false,
    data: payload.data
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// メインアプリからのメッセージを受信（ローカル通知用）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body } = event.data
    
    self.registration.showNotification(title, {
      body: body,
      icon: '/work.mp4',
      badge: '/work.mp4',
      tag: 'hiit-notification',
      requireInteraction: false
    })
  }
})

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('通知がクリックされました:', event)
  event.notification.close()

  // アプリを開く
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既に開いているウィンドウがあればフォーカス
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus()
        }
      }
      // なければ新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow('/')
      }
    })
  )
})

