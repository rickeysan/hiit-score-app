# Firebase Cloud Messaging (FCM) セットアップガイド

## 🚀 サーバーサイドFCM実装

このアプリでは、Google Cloud Functionsを使用してサーバーサイドからFCMプッシュ通知を送信します。

## 📋 必要な設定

### 1. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. **Authentication** を有効化（匿名認証を許可）
3. **Firestore Database** を作成
4. **Cloud Functions** を有効化

### 2. Web Push 証明書の設定

1. Firebase Console > **Project Settings** > **Cloud Messaging**
2. **Web Push certificates** セクションで **Generate key pair** をクリック
3. 生成されたVAPIDキーをコピー

### 3. Firebase設定の更新

`src/firebase.js` の設定値を実際の値に更新：

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "YOUR_ACTUAL_APP_ID",
  measurementId: "YOUR_ACTUAL_MEASUREMENT_ID"
}
```

### 4. VAPIDキーの設定

`src/firebase.js` のVAPIDキーを更新：

```javascript
const currentToken = await getToken(messaging, {
  vapidKey: 'YOUR_ACTUAL_VAPID_KEY', // ここに実際のVAPIDキーを設定
  serviceWorkerRegistration: registration
})
```

## 🛠️ デプロイ手順

### 1. Firebase CLIのインストール

```bash
npm install -g firebase-tools
```

### 2. Firebaseにログイン

```bash
firebase login
```

### 3. プロジェクトの初期化

```bash
firebase init
```

以下の機能を選択：
- ✅ Functions
- ✅ Firestore
- ✅ Hosting

### 4. Cloud Functionsのデプロイ

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Firestoreルールのデプロイ

```bash
firebase deploy --only firestore:rules
```

### 6. アプリのデプロイ

```bash
npm run build
firebase deploy --only hosting
```

## 🔧 動作の仕組み

### 1. 通知権限のリクエスト
- ユーザーが「通知権限を許可する」ボタンをクリック
- 匿名認証でFirebaseにサインイン
- FCMトークンを取得してFirestoreに保存

### 2. 10秒遅延通知の送信
- ユーザーが「10秒後にFCM通知を送信」ボタンをクリック
- Cloud Function `scheduleDelayedNotification` を呼び出し
- Firestoreに通知スケジュールを保存
- 10秒後にCloud Function `sendScheduledNotification` が実行
- FCM APIを使用してプッシュ通知を送信

### 3. 即座通知の送信（テスト用）
- ユーザーが「即座にFCM通知を送信」ボタンをクリック
- Cloud Function `sendImmediateNotification` を呼び出し
- 即座にFCM APIを使用してプッシュ通知を送信

## 📱 通知の特徴

- **サーバーサイド送信**: ブラウザが閉じていても通知が届く
- **本格的なFCM**: Google Cloud FunctionsからFCM APIを直接呼び出し
- **スケジュール機能**: 指定時間後に通知を送信
- **匿名認証**: ユーザー登録不要で利用可能

## 🐛 トラブルシューティング

### 通知が届かない場合

1. **ブラウザの通知設定を確認**
   - ブラウザの設定で通知が許可されているか確認

2. **Firebase設定を確認**
   - `firebase.js` の設定値が正しいか確認
   - VAPIDキーが正しく設定されているか確認

3. **Cloud Functionsのログを確認**
   ```bash
   firebase functions:log
   ```

4. **Firestoreのデータを確認**
   - `fcmTokens` コレクションにトークンが保存されているか確認
   - `notificationSchedules` コレクションにスケジュールが保存されているか確認

### デプロイエラーの場合

1. **Firebase CLIのバージョンを確認**
   ```bash
   firebase --version
   ```

2. **Node.jsのバージョンを確認**
   ```bash
   node --version
   ```
   Node.js 18以上が必要です

3. **依存関係のインストール**
   ```bash
   cd functions
   npm install
   ```

## 📚 参考資料

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore](https://firebase.google.com/docs/firestore)
- [Web Push](https://developers.google.com/web/fundamentals/push-notifications)
