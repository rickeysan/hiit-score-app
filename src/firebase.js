import { initializeApp } from 'firebase/app'

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

export { app }

