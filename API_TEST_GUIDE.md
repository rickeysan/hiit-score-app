# Cloud Functions API テストガイド

## 🚀 実装完了！

ブラウザからCloud FunctionsのAPIを呼び出す機能が実装されました。

## 📋 実装内容

### 1. **Cloud Functions API**
- `setNotificationTimer`: タイマー設定API
- ブラウザ識別キー + 通知時間をFirestoreに保存
- バリデーション機能付き

### 2. **ブラウザ側実装**
- `setNotificationTimer()`: 新しいAPIを呼び出す関数
- ブラウザ識別キーの自動生成・保存
- エラーハンドリング付き

### 3. **UI実装**
- 「🆕 新しいAPIでタイマー設定（10秒）」ボタン
- 「🆕 新しいAPIでタイマー設定（5秒）」ボタン
- ステータス表示機能

## 🧪 テスト手順

### 1. **Firebase設定**
```bash
# Firebase CLIでログイン
firebase login

# プロジェクトを初期化
firebase init

# Cloud Functionsをデプロイ
firebase deploy --only functions
```

### 2. **アプリの起動**
```bash
npm run dev
```

### 3. **テスト実行**
1. **通知権限を許可する** ボタンをクリック
2. **🆕 新しいAPIでタイマー設定（10秒）** ボタンをクリック
3. コンソールでAPI呼び出し結果を確認
4. Firestoreでデータ保存を確認

## 📊 データ構造

### **Firestore: notificationSchedules コレクション**
```javascript
{
  id: "auto_generated_id",
  browserKey: "browser_abc12345_1234567890",
  notifyTime: Timestamp,
  title: "すきまフィット",
  body: "運動の時間です！身体を動かしてリフレッシュしましょう 🏃‍♀️",
  status: "pending",
  createdAt: Timestamp,
  retryCount: 0
}
```

## 🔍 確認ポイント

### **1. API呼び出し成功**
- コンソールに「タイマー設定結果: {success: true, ...}」が表示される
- ステータスに「タイマーが設定されました！10秒後に通知されます」が表示される

### **2. Firestoreデータ保存**
- Firebase Console > Firestore Database で確認
- `notificationSchedules` コレクションに新しいドキュメントが作成される

### **3. エラーハンドリング**
- 過去の時間を指定した場合のエラー
- 必須パラメータが不足した場合のエラー
- ネットワークエラーの処理

## 🐛 トラブルシューティング

### **API呼び出しが失敗する場合**
1. **Firebase設定を確認**
   - `src/firebase.js` の設定値が正しいか
   - Firebase プロジェクトが正しく設定されているか

2. **Cloud Functionsのデプロイを確認**
   ```bash
   firebase functions:log
   ```

3. **ブラウザのコンソールエラーを確認**
   - ネットワークタブでAPI呼び出しを確認
   - エラーメッセージを確認

### **Firestoreにデータが保存されない場合**
1. **Firestoreルールを確認**
   - 認証が必要な場合は匿名認証を有効化
   - ルールが適切に設定されているか確認

2. **Firebase プロジェクトの設定を確認**
   - Firestore Databaseが有効になっているか
   - 正しいプロジェクトを選択しているか

## 📈 次のステップ

### **Phase 1: 基本API（完了）**
- ✅ Cloud Functions API作成
- ✅ ブラウザからのAPI呼び出し
- ✅ Firestoreデータ保存

### **Phase 2: バッチ処理（次の実装）**
- Cloud Scheduler設定
- バッチ処理Cloud Function作成
- FCM送信機能

### **Phase 3: 本格運用**
- エラーハンドリング強化
- ログ機能追加
- 監視機能追加

## 🎯 現在の状態

- **✅ ブラウザ → Cloud Functions API**: 完了
- **✅ データ保存**: 完了
- **⏳ バッチ処理**: 未実装
- **⏳ FCM送信**: 未実装

これで、ブラウザからCloud FunctionsのAPIを呼び出して、Firestoreにデータを保存する機能が完成しました！🎉
