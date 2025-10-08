import React, { useState, useEffect, useRef } from 'react'
import CameraView from './components/CameraView'
import ScoreDisplay from './components/ScoreDisplay'
import SessionHistory from './components/SessionHistory'
import Fireworks from './components/Fireworks'
import './App.css'

function App() {
  const [currentScore, setCurrentScore] = useState(0)
  const [sessionHistory, setSessionHistory] = useState([])
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const lastMilestoneRef = useRef(0)

  // マイルストーン（花火を表示するスコア）
  const milestones = [50, 100, 150, 200, 300, 500]

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

  const startSession = () => {
    setIsSessionActive(true)
    setCurrentScore(0)
    lastMilestoneRef.current = 0 // マイルストーンをリセット
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
    <div className="app">
      <header className="app-header">
        <h1>🏃‍♂️ HIITスコアアプリ</h1>
        <p>カメラに向かって運動して、リアルタイムでスコアを測定しよう！</p>
      </header>

      <main className="app-main">
        <div className="camera-section">
          <CameraView 
            onScoreUpdate={setCurrentScore}
            isActive={isSessionActive}
          />
          
          <div className="session-controls">
            {!isSessionActive ? (
              <button 
                className="btn btn-start" 
                onClick={startSession}
              >
                セッション開始
              </button>
            ) : (
              <button 
                className="btn btn-end" 
                onClick={endSession}
              >
                セッション終了
              </button>
            )}
          </div>
        </div>

        <div className="score-section">
          <ScoreDisplay 
            score={currentScore}
            isActive={isSessionActive}
          />
        </div>

        <div className="history-section">
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
    </div>
  )
}

export default App
