import React, { useState, useEffect, useRef } from 'react'
import CameraView from './components/CameraView'
import SessionHistory from './components/SessionHistory'
import Fireworks from './components/Fireworks'
import { Analytics } from '@vercel/analytics/react'
import { requestNotificationPermission, setNotificationTimer, scheduleDelayedNotification, sendImmediateNotification } from './firebase'

function App() {
  // 体操データの配列
  const exercises = [
    {
      id: 1,
      title: '腕回し',
      videoUrl: '/work.mp4',
      description: '肩こり・首こりの緩和に効果的',
      effects: [
        '肩こり・首こりの緩和',
        '上半身の血行促進',
        '姿勢改善とリフレッシュ効果'
      ],
      steps: [
        'カメラの前に立ち、肩幅に足を開きます',
        '両腕を左右に大きく広げます',
        'リズミカルに腕を上下に動かします',
        '肩甲骨を意識しながら、大きく動かしましょう'
      ],
      points: [
        '呼吸を止めずに、自然な呼吸を心がけましょう',
        '無理のない範囲で動かし、痛みを感じたら中止してください',
        'カメラに全身が映るように立ち位置を調整しましょう'
      ],
      timing: [
        'デスクワークの合間（1時間に1回程度）',
        '会議の前後のリフレッシュに',
        '集中力が落ちてきたと感じたとき'
      ]
    },
    {
      id: 2,
      title: '全身ストレッチ',
      videoUrl: '/46744_640x360.mp4',
      description: '全身をほぐしてリフレッシュ',
      effects: [
        '全身の血行促進',
        '筋肉の緊張緩和',
        'リラックス効果'
      ],
      steps: [
        'カメラの前に立ち、リラックスします',
        '腕を大きく上に伸ばします',
        '体を左右にゆっくり傾けます',
        '深呼吸しながら全身をほぐします'
      ],
      points: [
        'ゆっくりとした動作を心がけましょう',
        '深い呼吸を意識してください',
        '痛みを感じる場合は無理をしないでください'
      ],
      timing: [
        '起床後や就寝前',
        '長時間のデスクワーク後',
        '運動前のウォームアップに'
      ]
    },
    {
      id: 3,
      title: 'ジャンピングジャック',
      videoUrl: '/work.mp4',
      description: '心拍数を上げて有酸素運動',
      effects: [
        '心肺機能の向上',
        '全身の筋肉を活性化',
        'カロリー消費'
      ],
      steps: [
        '足を揃えて立ちます',
        'ジャンプしながら両足を開き、両手を頭上で合わせます',
        'ジャンプして元の姿勢に戻ります',
        'リズミカルに繰り返します'
      ],
      points: [
        '着地時は膝を柔らかく使いましょう',
        '呼吸を止めないように',
        '周囲の安全を確認してください'
      ],
      timing: [
        '眠気覚ましに',
        '運動不足解消に',
        '集中力を高めたいとき'
      ]
    }
  ]

  const [currentScore, setCurrentScore] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [sessionHistory, setSessionHistory] = useState(() => {
    // localStorageから履歴を読み込む
    const saved = localStorage.getItem('sessionHistory')
    return saved ? JSON.parse(saved) : []
  })
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showCongratulations, setShowCongratulations] = useState(false)
  const [hasCameraError, setHasCameraError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const lastMilestoneRef = useRef(0)
  const congratulationsShownRef = useRef(false)
  const [notificationStatus, setNotificationStatus] = useState('')
  const [isNotificationScheduled, setIsNotificationScheduled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [timerStatus, setTimerStatus] = useState('')
  const [isTimerSet, setIsTimerSet] = useState(false)

  // 現在選択中の体操
  const currentExercise = exercises[currentExerciseIndex]

  // マイルストーン（花火を表示するスコア）
  const milestones = [50, 100, 150, 200, 300, 500]

  // sessionHistoryが更新されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory))
  }, [sessionHistory])

  // スコアを滑らかに表示するアニメーション
  useEffect(() => {
    const increment = (currentScore - displayScore) / 10
    if (Math.abs(currentScore - displayScore) > 0.1) {
      const timer = setTimeout(() => {
        setDisplayScore(prev => prev + increment)
      }, 16) // 約60fps
      return () => clearTimeout(timer)
    } else {
      setDisplayScore(currentScore)
    }
  }, [currentScore, displayScore])

  // スコアがマイルストーンを超えたら花火を表示
  useEffect(() => {
    const currentMilestone = milestones.find(
      m => Math.floor(currentScore) >= m && lastMilestoneRef.current < m
    )

    if (currentMilestone && isSessionActive) {
      lastMilestoneRef.current = currentMilestone
      setShowFireworks(true)
      
      // 効果音を追加する場合はここに
      console.log('🎉 マイルストーン達成!', currentMilestone)
    }
  }, [currentScore, isSessionActive])

  // スコアが200に達したら「お疲れ様でした！」を表示
  useEffect(() => {
    if (Math.floor(currentScore) >= 200 && isSessionActive && !congratulationsShownRef.current) {
      congratulationsShownRef.current = true
      setShowCongratulations(true)
      
      // 5秒後に非表示
      const timer = setTimeout(() => {
        setShowCongratulations(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [currentScore, isSessionActive])

  const startSession = () => {
    setIsSessionActive(true)
    setCurrentScore(0)
    setDisplayScore(0)
    lastMilestoneRef.current = 0 // マイルストーンをリセット
    congratulationsShownRef.current = false // お祝いメッセージをリセット
    setShowCongratulations(false)
  }

  const endSession = () => {
    setIsSessionActive(false)
    if (currentScore > 0) {
      const newSession = {
        id: Date.now(),
        score: Math.floor(currentScore),
        timestamp: new Date().toLocaleString('ja-JP'),
        duration: '1分' // 実際のセッション時間を記録
      }
      setSessionHistory(prev => [newSession, ...prev])
    }
  }

  const handleFireworksComplete = () => {
    setShowFireworks(false)
  }

  // 前の体操に切り替え
  const handlePreviousExercise = () => {
    setCurrentExerciseIndex((prev) => 
      prev === 0 ? exercises.length - 1 : prev - 1
    )
  }

  // 次の体操に切り替え
  const handleNextExercise = () => {
    setCurrentExerciseIndex((prev) => 
      prev === exercises.length - 1 ? 0 : prev + 1
    )
  }

  // 通知権限をリクエスト
  const handleRequestNotificationPermission = async () => {
    try {
      const token = await requestNotificationPermission()
      if (token) {
        setNotificationPermission('granted')
        setNotificationStatus('通知権限が許可されました！')
      } else {
        setNotificationPermission('denied')
        setNotificationStatus('通知権限が拒否されました')
      }
    } catch (error) {
      console.error('通知権限のリクエストエラー:', error)
      setNotificationStatus('エラーが発生しました')
    }
  }

  // 10秒後にFCM通知を送信
  const handleScheduleNotification = async () => {
    if (notificationPermission !== 'granted') {
      setNotificationStatus('まず通知権限を許可してください')
      return
    }

    try {
      const success = await scheduleDelayedNotification(
        'すきまフィット',
        '運動の時間です！身体を動かしてリフレッシュしましょう 🏃‍♀️',
        10
      )
      
      if (success) {
        setIsNotificationScheduled(true)
        setNotificationStatus('10秒後にFCM通知が送信されます...')
        
        // 10秒後にステータスをリセット
        setTimeout(() => {
          setIsNotificationScheduled(false)
          setNotificationStatus('FCM通知が送信されました！')
        }, 10000)
      } else {
        setNotificationStatus('FCM通知のスケジュールに失敗しました')
      }
    } catch (error) {
      console.error('FCM通知スケジュールエラー:', error)
      setNotificationStatus('エラーが発生しました')
    }
  }

  // 即座にFCM通知を送信（テスト用）
  const handleImmediateNotification = async () => {
    if (notificationPermission !== 'granted') {
      setNotificationStatus('まず通知権限を許可してください')
      return
    }

    try {
      const success = await sendImmediateNotification(
        'すきまフィット',
        '即座にFCM通知を送信しました！ 🚀'
      )
      
      if (success) {
        setNotificationStatus('即座にFCM通知が送信されました！')
      } else {
        setNotificationStatus('即座FCM通知の送信に失敗しました')
      }
    } catch (error) {
      console.error('即座FCM通知送信エラー:', error)
      setNotificationStatus('エラーが発生しました')
    }
  }

  // 新しいAPIを使ってタイマーを設定
  const handleSetTimer = async (delaySeconds = 10) => {
    try {
      setTimerStatus('タイマーを設定中...')
      setIsTimerSet(true)
      
      const result = await setNotificationTimer(
        delaySeconds,
        'すきまフィット',
        '運動の時間です！身体を動かしてリフレッシュしましょう 🏃‍♀️'
      )
      
      if (result.success) {
        setTimerStatus(`タイマーが設定されました！${delaySeconds}秒後に通知されます`)
        console.log('タイマー設定成功:', result)
      } else {
        setTimerStatus('タイマーの設定に失敗しました')
      }
    } catch (error) {
      console.error('タイマー設定エラー:', error)
      setTimerStatus(`エラー: ${error.message}`)
    } finally {
      // 3秒後にステータスをリセット
      setTimeout(() => {
        setIsTimerSet(false)
        setTimerStatus('')
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <Analytics />
      <header className="text-center py-2 px-4 bg-white shadow-md border-b-4 border-orange-400">
        <h1 className="flex items-center justify-center gap-4 text-4xl md:text-5xl font-bold mb-0">
          <video 
            src="/work.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            width="80"
            height="80"
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
            style={{ imageRendering: 'crisp-edges' }}
          />
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">すきまフィット</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          カメラに向かって身体を動かして、作業のすきま時間にリフレッシュ！
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <CameraView 
            onScoreUpdate={setCurrentScore}
            isActive={isSessionActive}
            onCameraError={setHasCameraError}
          />
          
          {!hasCameraError && (
            <div className="mt-6">
              {!isSessionActive ? (
                <button 
                  className="w-full py-4 px-8 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-lg rounded-full uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                  onClick={startSession}
                >
                  セッション開始
                </button>
              ) : (
                <button 
                  className="w-full py-4 px-8 bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-bold text-lg rounded-full uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                  onClick={endSession}
                >
                  セッション終了
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <div className="flex flex-col items-center">            
            {/* 体操の説明カード */}
            <div className="w-full max-w-[400px] mb-6 relative">
              {/* カードコンテンツ（スライドエフェクト付き） */}
              <div className="overflow-hidden">
                <div 
                  key={currentExercise.id}
                  className="animate-slide-in"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-800 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent mb-1">
                      {currentExercise.title}
                    </h3>
                    <p className="text-sm text-gray-600">{currentExercise.description}</p>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-700 mb-3 text-center">お手本映像</h4>
                  <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-orange-200">
                    <video 
                      key={currentExercise.videoUrl}
                      src={currentExercise.videoUrl}
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-auto"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  >
                    📖 詳細を確認する
                  </button>
                </div>
              </div>

              {/* カードナビゲーション */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={handlePreviousExercise}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  aria-label="前の体操"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex-1 text-center mx-4">
                  <div className="flex items-center justify-center gap-2">
                    {exercises.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentExerciseIndex 
                            ? 'w-8 bg-gradient-to-r from-orange-500 to-yellow-500' 
                            : 'w-2 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleNextExercise}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  aria-label="次の体操"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800">現在のスコア</h2>

            {/* 円形プログレスバー */}
            <div className="relative w-[200px] h-[200px] mb-6">
              <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
                {/* 背景の円 */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="#fed7aa"
                  strokeWidth="12"
                  fill="none"
                />
                {/* 進捗の円 */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 90}
                  strokeDashoffset={2 * Math.PI * 90 * (1 - Math.min(displayScore / 200, 1))}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* 中央のスコア表示 */}
              <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  {Math.floor(displayScore)}
                </div>
                <div className="text-sm text-gray-500 mt-1">/ 200</div>
              </div>
            </div>
            
            {isSessionActive && (
              <div className="flex items-center justify-center gap-2 bg-orange-100 py-2 px-4 rounded-full">
                <span className="w-3 h-3 bg-orange-500 rounded-full pulse-dot"></span>
                <span className="font-semibold text-orange-600">セッション中</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <SessionHistory 
            sessions={sessionHistory}
          />
        </div>

        {/* 通知機能セクション */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">🔔 プッシュ通知機能</h2>
          
          <div className="max-w-md mx-auto space-y-4">
            {/* 通知権限の状態表示 */}
            <div className="text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                notificationPermission === 'granted' 
                  ? 'bg-green-100 text-green-800' 
                  : notificationPermission === 'denied'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {notificationPermission === 'granted' && '✅ 通知許可済み'}
                {notificationPermission === 'denied' && '❌ 通知拒否済み'}
                {notificationPermission === 'default' && '⏳ 通知未設定'}
              </div>
            </div>

            {/* 通知権限リクエストボタン */}
            {notificationPermission !== 'granted' && (
              <button
                onClick={handleRequestNotificationPermission}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              >
                🔔 通知権限を許可する
              </button>
            )}

            {/* 新しいAPIテストボタン */}
            {notificationPermission === 'granted' && (
              <div className="space-y-3">
                {/* 新しいAPIを使ってタイマー設定 */}
                <button
                  onClick={() => handleSetTimer(10)}
                  disabled={isTimerSet}
                  className={`w-full py-3 px-6 font-bold text-lg rounded-lg shadow-md transition-all duration-300 ${
                    isTimerSet
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {isTimerSet ? '⏳ タイマー設定中...' : '🆕 新しいAPIでタイマー設定（10秒）'}
                </button>
                
                {/* 5秒タイマー */}
                <button
                  onClick={() => handleSetTimer(5)}
                  disabled={isTimerSet}
                  className={`w-full py-2 px-4 font-semibold text-sm rounded-lg shadow-md transition-all duration-300 ${
                    isTimerSet
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  🆕 新しいAPIでタイマー設定（5秒）
                </button>
                
                {/* 既存のFCM通知ボタン */}
                <button
                  onClick={handleScheduleNotification}
                  disabled={isNotificationScheduled}
                  className={`w-full py-3 px-6 font-bold text-lg rounded-lg shadow-md transition-all duration-300 ${
                    isNotificationScheduled
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {isNotificationScheduled ? '⏳ FCM通知送信中...' : '🚀 10秒後にFCM通知を送信'}
                </button>
                
                {/* 即座通知ボタン（テスト用） */}
                <button
                  onClick={handleImmediateNotification}
                  className="w-full py-2 px-4 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  ⚡ 即座にFCM通知を送信（テスト用）
                </button>
              </div>
            )}

            {/* ステータス表示 */}
            {(notificationStatus || timerStatus) && (
              <div className="text-center space-y-2">
                {notificationStatus && (
                  <p className={`text-sm font-medium ${
                    notificationStatus.includes('エラー') || notificationStatus.includes('失敗')
                      ? 'text-red-600'
                      : notificationStatus.includes('許可') || notificationStatus.includes('送信')
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}>
                    {notificationStatus}
                  </p>
                )}
                {timerStatus && (
                  <p className={`text-sm font-medium ${
                    timerStatus.includes('エラー') || timerStatus.includes('失敗')
                      ? 'text-red-600'
                      : timerStatus.includes('設定')
                      ? 'text-green-600'
                      : 'text-blue-600'
                  }`}>
                    {timerStatus}
                  </p>
                )}
              </div>
            )}

            {/* 説明文 */}
            <div className="text-center text-sm text-gray-600">
              <p>この機能を使うと、ボタンを押してから10秒後に<strong>サーバーサイドFCM</strong>でプッシュ通知が送信されます。</p>
              <p className="mt-1">Google Cloud Functionsを使用して、本格的なプッシュ通知を実現！</p>
              <p className="mt-1 text-xs text-gray-500">※ブラウザが閉じていても通知が届きます</p>
            </div>
          </div>
        </div>
      </main>

      {/* 花火アニメーション */}
      <Fireworks 
        show={showFireworks}
        onComplete={handleFireworksComplete}
      />

      {/* 100点達成メッセージ */}
      {showCongratulations && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[10000] pointer-events-none animate-fade-in">
          <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-orange-200">
            <div className="text-2xl md:text-3xl font-semibold text-center text-orange-500">
              お疲れ様でした
            </div>
          </div>
        </div>
      )}

      {/* ストレッチ解説モーダル */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-400 to-yellow-400 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{currentExercise.title}の詳細</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-3xl font-bold transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 space-y-6">
              {/* お手本映像 */}
              <div className="rounded-xl overflow-hidden shadow-lg border-2 border-orange-200">
                <video 
                  src={currentExercise.videoUrl}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-auto"
                  style={{ imageRendering: 'crisp-edges' }}
                />
              </div>

              {/* 解説セクション */}
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-orange-600 mb-2 flex items-center gap-2">
                    🎯 効果
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {currentExercise.effects.map((effect, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-blue-600 mb-2 flex items-center gap-2">
                    📝 やり方
                  </h3>
                  <ol className="space-y-3 text-gray-700">
                    {currentExercise.steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="font-bold text-blue-500 min-w-[24px]">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-yellow-600 mb-2 flex items-center gap-2">
                    ⚠️ ポイント
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {currentExercise.points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-green-600 mb-2 flex items-center gap-2">
                    💡 おすすめタイミング
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {currentExercise.timing.map((time, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 閉じるボタン */}
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
