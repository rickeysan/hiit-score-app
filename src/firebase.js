import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyB7tVG9AKhVFipO8oLxG1ClxiOIRshoYpw",
  authDomain: "sukima-fit.firebaseapp.com",
  projectId: "sukima-fit",
  storageBucket: "sukima-fit.firebasestorage.app",
  messagingSenderId: "747431497793",
  appId: "1:747431497793:web:5f4f03c1db84f12699f6c0",
  measurementId: "G-JVJW9GJKNV"
}

// Firebaseの初期化
const app = initializeApp(firebaseConfig)

// Firebaseサービスの初期化
const auth = getAuth(app)
const db = getFirestore(app)
const functions = getFunctions(app)

// Messagingインスタンスの取得（ブラウザがサポートしている場合のみ）
let messaging = null
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch (err) {
    console.log('Firebase Messaging initialization error:', err)
  }
}

// 匿名認証でサインイン
export const signInAnonymouslyUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth)
    return userCredential.user
  } catch (error) {
    console.error('匿名認証エラー:', error)
    throw error
  }
}

// 通知権限をリクエストし、FCMトークンを取得
export const requestNotificationPermission = async () => {
  try {
    // 匿名認証でサインイン
    const user = await signInAnonymouslyUser()
    console.log('匿名ユーザーでサインイン:', user.uid)
    
    // 通知権限をリクエスト
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log('通知権限が許可されました')
      
      // Service Workerの登録
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Service Worker registered:', registration)
      
      // FCMトークンを取得
      if (messaging) {
        const currentToken = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY', // Firebase Console > Project Settings > Cloud Messaging > Web Push certificates から取得
          serviceWorkerRegistration: registration
        })
        
        if (currentToken) {
          console.log('FCMトークン:', currentToken)
          
          // FCMトークンをFirestoreに保存
          await saveFCMTokenToFirestore(user.uid, currentToken)
          
          return currentToken
        } else {
          console.log('トークンの取得に失敗しました')
        }
      }
    } else {
      console.log('通知権限が拒否されました')
    }
  } catch (err) {
    console.error('通知権限のリクエストエラー:', err)
  }
  return null
}

// FCMトークンをFirestoreに保存
const saveFCMTokenToFirestore = async (userId, token) => {
  try {
    await setDoc(doc(db, 'fcmTokens', userId), {
      token: token,
      userId: userId,
      createdAt: new Date(),
      lastUsed: new Date()
    })
    console.log('FCMトークンをFirestoreに保存しました')
  } catch (error) {
    console.error('FCMトークンの保存エラー:', error)
  }
}

// フォアグラウンドでメッセージを受信
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('フォアグラウンドでメッセージを受信:', payload)
        resolve(payload)
      })
    }
  })

// ブラウザ識別キーを生成・取得
const getBrowserKey = () => {
  let browserKey = localStorage.getItem('browserKey')
  if (!browserKey) {
    // シンプルなブラウザ識別キーを生成
    browserKey = 'browser_' + Math.random().toString(36).substr(2, 8) + '_' + Date.now()
    localStorage.setItem('browserKey', browserKey)
  }
  return browserKey
}

// Cloud Functions APIを呼び出してタイマーを設定
export const setNotificationTimer = async (delaySeconds = 10, title, body) => {
  try {
    // ブラウザ識別キーを取得
    const browserKey = getBrowserKey()
    
    // 通知時間を計算（現在時刻 + 遅延秒数）
    const notifyTime = new Date(Date.now() + (delaySeconds * 1000))
    
    // Cloud Functionを呼び出し
    const setTimer = httpsCallable(functions, 'setNotificationTimer')
    
    const result = await setTimer({
      browserKey: browserKey,
      notifyTime: notifyTime.toISOString(),
      title: title,
      body: body
    })
    
    console.log('タイマー設定結果:', result.data)
    return result.data
  } catch (err) {
    console.error('タイマー設定エラー:', err)
    throw err
  }
}

// 既存の関数（後方互換性のため保持）
export const scheduleDelayedNotification = async (title, body, delaySeconds = 10) => {
  try {
    const result = await setNotificationTimer(delaySeconds, title, body)
    return result.success
  } catch (err) {
    console.error('通知のスケジュールエラー:', err)
    return false
  }
}

// 即座にFCM通知を送信（テスト用）
export const sendImmediateNotification = async (title, body) => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('ユーザーが認証されていません')
    }

    const sendNotification = httpsCallable(functions, 'sendImmediateNotification')
    
    const result = await sendNotification({
      userId: user.uid,
      title: title,
      body: body
    })
    
    console.log('即座通知送信結果:', result.data)
    return result.data.success
  } catch (err) {
    console.error('即座通知送信エラー:', err)
    return false
  }
}

export { messaging }

