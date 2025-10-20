import React, { useState, useEffect, useRef } from 'react'
import CameraView from './components/CameraView'
import SessionHistory from './components/SessionHistory'
import Fireworks from './components/Fireworks'
import { Analytics } from '@vercel/analytics/react'

function App() {
  const [currentScore, setCurrentScore] = useState(0)
  const [displayScore, setDisplayScore] = useState(0)
  const [sessionHistory, setSessionHistory] = useState([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showCongratulations, setShowCongratulations] = useState(false)
  const lastMilestoneRef = useRef(0)
  const congratulationsShownRef = useRef(false)

  // マイルストーン（花火を表示するスコア）
  const milestones = [50, 100, 150, 200, 300, 500]

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <Analytics />
      <header className="text-center py-8 px-4 bg-white shadow-md border-b-4 border-orange-400">
        <h1 className="flex items-center justify-center gap-4 text-4xl md:text-5xl font-bold mb-2">
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
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">HIITスコアアプリ</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          カメラに向かって運動して、リアルタイムでスコアを測定しよう！
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <CameraView 
            onScoreUpdate={setCurrentScore}
            isActive={isSessionActive}
          />
          
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
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <div className="flex flex-col items-center">
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
    </div>
  )
}

export default App
