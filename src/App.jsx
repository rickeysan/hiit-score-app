import React, { useState, useEffect, useRef } from 'react'
import CameraView from './components/CameraView'
import SessionHistory from './components/SessionHistory'
import Fireworks from './components/Fireworks'
import { Analytics } from '@vercel/analytics/react'
import { exercises } from './data/exercises'

function App() {

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
  
  // BGM関連の状態
  const [isBgmPlaying, setIsBgmPlaying] = useState(false)
  const [bgmVolume, setBgmVolume] = useState(0.5)
  const bgmAudioRef = useRef(null)
  
  // 効果音ON/OFFの状態
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)

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

  // スコアが目標に達したら「お疲れ様でした！」を表示
  useEffect(() => {
    const targetScore = currentExercise.targetScore
    if (Math.floor(currentScore) >= targetScore && isSessionActive && !congratulationsShownRef.current) {
      congratulationsShownRef.current = true
      setShowCongratulations(true)
      
      // 5秒後に非表示
      const timer = setTimeout(() => {
        setShowCongratulations(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [currentScore, isSessionActive, currentExercise.targetScore])

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


  // BGM再生/停止の切り替え
  const toggleBgm = () => {
    if (!bgmAudioRef.current) return
    
    if (isBgmPlaying) {
      bgmAudioRef.current.pause()
      setIsBgmPlaying(false)
    } else {
      bgmAudioRef.current.play()
      setIsBgmPlaying(true)
    }
  }

  // BGM音量の変更
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setBgmVolume(newVolume)
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = newVolume
    }
  }

  // BGM音声の初期化
  useEffect(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = bgmVolume
      bgmAudioRef.current.loop = true
    }
  }, [bgmVolume])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <Analytics />
      
      {/* BGM用のaudio要素（非表示） */}
      <audio 
        ref={bgmAudioRef}
        src="/music/jungle-waves-drumampbass-electronic-inspiring-promo-345013.mp3"
        preload="auto"
      />
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

      <main className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <CameraView 
            onScoreUpdate={setCurrentScore}
            isActive={isSessionActive}
            onCameraError={setHasCameraError}
          />
          
          {!hasCameraError && (
            <div className="mt-6 space-y-4">
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
              
              {/* BGMコントロール */}
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">🎵 BGM</span>
                  <button
                    onClick={toggleBgm}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      isBgmPlaying
                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isBgmPlaying ? '⏸︎ 停止' : '▶︎ 再生'}
                  </button>
                </div>
                
                {/* 音量調整 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">🔉</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={bgmVolume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-200 rounded appearance-none cursor-pointer accent-gray-400"
                  />
                  <span className="text-xs text-gray-400 min-w-[3ch] tabular-nums">{Math.round(bgmVolume * 100)}%</span>
                </div>
              </div>
              
              {/* 効果音ON/OFFコントロール */}
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">🔔 効果音</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="sound"
                        checked={isSoundEnabled}
                        onChange={() => setIsSoundEnabled(true)}
                        className="w-3 h-3 text-gray-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-600">ON</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="sound"
                        checked={!isSoundEnabled}
                        onChange={() => setIsSoundEnabled(false)}
                        className="w-3 h-3 text-gray-500 cursor-pointer"
                      />
                      <span className="text-xs text-gray-600">OFF</span>
                    </label>
                  </div>
                </div>
              </div>
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
                  strokeDashoffset={2 * Math.PI * 90 * (1 - Math.min(displayScore / currentExercise.targetScore, 1))}
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
                <div className="text-sm text-gray-500 mt-1">/ {currentExercise.targetScore}</div>
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
