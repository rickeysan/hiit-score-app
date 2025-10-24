const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
admin.initializeApp({
  projectId: "sukima-fit"
});

// タイマー設定API - ブラウザから呼び出し
exports.setNotificationTimer = functions.https.onCall(async (data, context) => {
  try {
    const { browserKey, notifyTime, title, body } = data;
    
    // 必須パラメータのチェック
    if (!browserKey || !notifyTime) {
      throw new functions.https.HttpsError('invalid-argument', 'browserKey and notifyTime are required');
    }

    // 通知時間のバリデーション
    const notifyDate = new Date(notifyTime);
    if (isNaN(notifyDate.getTime())) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid notifyTime format');
    }

    // 過去の時間でないかチェック
    if (notifyDate <= new Date()) {
      throw new functions.https.HttpsError('invalid-argument', 'notifyTime must be in the future');
    }

    // Firestoreに通知スケジュールを保存
    const scheduleData = {
      browserKey: browserKey,
      notifyTime: admin.firestore.Timestamp.fromDate(notifyDate),
      title: title || 'すきまフィット',
      body: body || '運動の時間です！身体を動かしてリフレッシュしましょう 🏃‍♀️',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      retryCount: 0
    };

    const docRef = await admin.firestore().collection('notificationSchedules').add(scheduleData);
    
    console.log('通知スケジュールを保存しました:', docRef.id);
    
    return {
      success: true,
      message: '通知スケジュールが設定されました',
      scheduleId: docRef.id,
      notifyTime: notifyDate.toISOString(),
      browserKey: browserKey
    };
  } catch (error) {
    console.error('タイマー設定エラー:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to set notification timer');
  }
});

// FCMトークンを保存する関数
exports.saveFCMToken = functions.https.onCall(async (data, context) => {
  try {
    const { token, userId } = data;
    
    if (!token || !userId) {
      throw new functions.https.HttpsError('invalid-argument', 'Token and userId are required');
    }

    // Firestoreにトークンを保存
    await admin.firestore().collection('fcmTokens').doc(userId).set({
      token: token,
      userId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: 'FCM token saved successfully' };
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to save FCM token');
  }
});

// 10秒後にFCM通知を送信する関数
exports.scheduleDelayedNotification = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body, delaySeconds = 10 } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }

    // 指定秒数後に通知を送信するスケジュール
    const scheduleTime = new Date(Date.now() + (delaySeconds * 1000));
    
    // Firestoreにスケジュール情報を保存
    const scheduleDoc = await admin.firestore().collection('notificationSchedules').add({
      userId: userId,
      title: title || 'すきまフィット',
      body: body || '運動の時間です！身体を動かしてリフレッシュしましょう 🏃‍♀️',
      scheduledTime: scheduleTime,
      status: 'scheduled',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 実際の通知送信は別のCloud Functionで処理
    await admin.firestore().collection('notificationSchedules').doc(scheduleDoc.id).update({
      scheduleId: scheduleDoc.id
    });

    return { 
      success: true, 
      message: `${delaySeconds}秒後に通知を送信します`,
      scheduleId: scheduleDoc.id,
      scheduledTime: scheduleTime.toISOString()
    };
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to schedule notification');
  }
});

// スケジュールされた通知を送信する関数（Firestoreトリガー）
exports.sendScheduledNotification = functions.firestore
  .document('notificationSchedules/{scheduleId}')
  .onCreate(async (snap, context) => {
    const scheduleData = snap.data();
    const scheduleId = context.params.scheduleId;
    
    try {
      // スケジュール時間をチェック
      const now = new Date();
      const scheduledTime = scheduleData.scheduledTime.toDate();
      
      if (now < scheduledTime) {
        // まだ時間が来ていない場合は、指定時間に実行するようにスケジュール
        const delay = scheduledTime.getTime() - now.getTime();
        
        setTimeout(async () => {
          await sendNotificationToUser(scheduleData.userId, scheduleData.title, scheduleData.body, scheduleId);
        }, delay);
        
        return null;
      } else {
        // 時間が来ている場合は即座に送信
        await sendNotificationToUser(scheduleData.userId, scheduleData.title, scheduleData.body, scheduleId);
      }
    } catch (error) {
      console.error('Error in sendScheduledNotification:', error);
      
      // エラーを記録
      await admin.firestore().collection('notificationSchedules').doc(scheduleId).update({
        status: 'failed',
        error: error.message,
        failedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// ユーザーにFCM通知を送信するヘルパー関数
async function sendNotificationToUser(userId, title, body, scheduleId) {
  try {
    // ユーザーのFCMトークンを取得
    const tokenDoc = await admin.firestore().collection('fcmTokens').doc(userId).get();
    
    if (!tokenDoc.exists) {
      throw new Error('FCM token not found for user');
    }
    
    const tokenData = tokenDoc.data();
    const fcmToken = tokenData.token;
    
    // FCMメッセージを作成
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: 'scheduled_notification',
        scheduleId: scheduleId,
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#FF6B35',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    // FCMに送信
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    
    // 送信成功を記録
    await admin.firestore().collection('notificationSchedules').doc(scheduleId).update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      messageId: response
    });
    
    return response;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    
    // 送信失敗を記録
    await admin.firestore().collection('notificationSchedules').doc(scheduleId).update({
      status: 'failed',
      error: error.message,
      failedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    throw error;
  }
}

// 即座にFCM通知を送信する関数（テスト用）
exports.sendImmediateNotification = functions.https.onCall(async (data, context) => {
  try {
    const { userId, title, body } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }

    await sendNotificationToUser(userId, title, body, 'immediate');
    
    return { success: true, message: 'Notification sent immediately' };
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});
