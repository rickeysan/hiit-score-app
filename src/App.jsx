import React, { useState, useEffect, useRef, useCallback } from 'react'
import CameraView from './components/CameraView'
import SessionHistory from './components/SessionHistory'
import Fireworks from './components/Fireworks'
import WelcomeModal from './components/WelcomeModal'
import BreathingModal from './components/BreathingModal'
import { Analytics } from '@vercel/analytics/react'
import { getExercises } from './data/exercises'
import { useLanguage } from './i18n/LanguageContext'

function App() {
  const { language, changeLanguage, t } = useLanguage()
  const exercises = getExercises(language)

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
  const [showUsageModal, setShowUsageModal] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const lastMilestoneRef = useRef(0)
  const congratulationsShownRef = useRef(false)
  
  // BGM関連の状態
  const [isBgmPlaying, setIsBgmPlaying] = useState(false)
  const [bgmVolume, setBgmVolume] = useState(0.5)
  const bgmAudioRef = useRef(null)
  
  // 効果音ON/OFFの状態
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  
  // 効果音用のaudio ref
  const goalAchievedSoundRef = useRef(null) // 目標達成時の効果音
  
  // スコアの増加率を監視するための前回スコア
  const previousScoreRef = useRef(0)
  
  // ヘッダーの表示・非表示の状態
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  
  // 動画の再生状態
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [isModalVideoPaused, setIsModalVideoPaused] = useState(false)
  const videoRef = useRef(null)
  const modalVideoRef = useRef(null)

  // ウェルカムモーダルの表示状態
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    // localStorageから訪問済みフラグを確認
    const hasVisited = localStorage.getItem('hasVisitedBefore')
    return !hasVisited // 訪問済みでない場合はtrueを返す
  })

  // 深呼吸モーダルの表示状態
  const [showBreathingModal, setShowBreathingModal] = useState(false)

  // 現在選択中の体操
  const currentExercise = exercises[currentExerciseIndex]
  
  // 言語が変わったときに体操インデックスをリセット（必要に応じて）
  useEffect(() => {
    // 言語変更時に現在のエクササイズが存在することを確認
    if (currentExerciseIndex >= exercises.length) {
      setCurrentExerciseIndex(0)
    }
  }, [language, exercises.length, currentExerciseIndex])

  // マイルストーン（花火を表示するスコア）
  const milestones = [50, 100, 150, 200, 300, 500]

  // sessionHistoryが更新されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('sessionHistory', JSON.stringify(sessionHistory))
  }, [sessionHistory])

  // スコアを滑らかに表示するアニメーション
  useEffect(() => {
    const increment = (currentScore - displayScore) / 5 // より速く追従するように変更
    if (Math.abs(currentScore - displayScore) > 0.1) {
      const timer = setTimeout(() => {
        setDisplayScore(prev => prev + increment)
      }, 8) // より頻繁に更新（約120fps相当）
      return () => clearTimeout(timer)
    } else {
      setDisplayScore(currentScore)
    }
  }, [currentScore, displayScore])

  // スコア変更時の処理を統合（効果音、マイルストーン、目標達成）
  useEffect(() => {
    if (!isSessionActive) return
    
    const targetScore = currentExercise.targetScore
    const previousScore = Math.floor(previousScoreRef.current)
    const currentScoreFloor = Math.floor(currentScore)
    
    // 1. マイルストーン達成時の花火表示
    const currentMilestone = milestones.find(
      m => currentScoreFloor >= m && lastMilestoneRef.current < m
    )
    if (currentMilestone) {
      lastMilestoneRef.current = currentMilestone
      setShowFireworks(true)
      console.log(t('milestoneAchieved'), currentMilestone)
    }
    
    // 2. 目標達成時のお祝いメッセージ
    if (currentScoreFloor >= targetScore && !congratulationsShownRef.current) {
      congratulationsShownRef.current = true
      setShowCongratulations(true)
      
      // 目標達成の効果音を再生
      if (isSoundEnabled && goalAchievedSoundRef.current) {
        goalAchievedSoundRef.current.currentTime = 0
        goalAchievedSoundRef.current.volume = 0.7
        goalAchievedSoundRef.current.play().catch(err => {
          console.log(t('goalAchievedSoundError'), err)
        })
      }
      
      // 5秒後に非表示
      const timer = setTimeout(() => {
        setShowCongratulations(false)
      }, 5000)
      
      // 前回スコアを更新
      previousScoreRef.current = currentScore
      
      return () => clearTimeout(timer)
    }
    
    // 前回スコアを更新（最後に更新して、次回の比較に使用）
    previousScoreRef.current = currentScore
  }, [currentScore, isSessionActive, isSoundEnabled, currentExercise.targetScore])

  const startSession = useCallback(() => {
    setIsSessionActive(true)
    setCurrentScore(0)
    setDisplayScore(0)
    lastMilestoneRef.current = 0 // マイルストーンをリセット
    congratulationsShownRef.current = false // お祝いメッセージをリセット
    setShowCongratulations(false)
    previousScoreRef.current = 0 // 前回スコアをリセット
    
    // 動画を最初から再生
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(err => {
        console.log(t('videoPlayError'), err)
      })
      setIsVideoPaused(false)
    }
  }, [])

  const endSession = useCallback(() => {
    setIsSessionActive(false)
    if (currentScore > 0) {
      const newSession = {
        id: Date.now(),
        score: Math.floor(currentScore),
        timestamp: new Date().toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US'),
        duration: language === 'ja' ? '1分' : '1 min', // 実際のセッション時間を記録
        exerciseId: currentExercise.id,
        exerciseTitle: currentExercise.title
      }
      setSessionHistory(prev => [newSession, ...prev])
    }
    // 深呼吸モーダルを表示
    setShowBreathingModal(true)
  }, [currentScore, currentExercise.id, currentExercise.title, language])

  const handleFireworksComplete = useCallback(() => {
    setShowFireworks(false)
  }, [])

  // 前の体操に切り替え
  const handlePreviousExercise = useCallback(() => {
    setCurrentExerciseIndex((prev) => 
      prev === 0 ? exercises.length - 1 : prev - 1
    )
  }, [])

  // 次の体操に切り替え
  const handleNextExercise = useCallback(() => {
    setCurrentExerciseIndex((prev) => 
      prev === exercises.length - 1 ? 0 : prev + 1
    )
  }, [])

  // 動画の再生/一時停止を切り替え
  const toggleVideo = useCallback(() => {
    if (!videoRef.current) return
    
    if (isVideoPaused) {
      videoRef.current.play()
      setIsVideoPaused(false)
      } else {
      videoRef.current.pause()
      setIsVideoPaused(true)
    }
  }, [isVideoPaused])
  
  // モーダル内動画の再生/一時停止を切り替え
  const toggleModalVideo = useCallback(() => {
    if (!modalVideoRef.current) return
    
    if (isModalVideoPaused) {
      modalVideoRef.current.play()
      setIsModalVideoPaused(false)
      } else {
      modalVideoRef.current.pause()
      setIsModalVideoPaused(true)
    }
  }, [isModalVideoPaused])

  // BGM再生/停止の切り替え
  const toggleBgm = useCallback(() => {
    if (!bgmAudioRef.current) return
    
    if (isBgmPlaying) {
      bgmAudioRef.current.pause()
      setIsBgmPlaying(false)
      } else {
      bgmAudioRef.current.play()
      setIsBgmPlaying(true)
    }
  }, [isBgmPlaying])

  // BGM音量の変更
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value)
    setBgmVolume(newVolume)
    if (bgmAudioRef.current) {
      bgmAudioRef.current.volume = newVolume
    }
  }, [])

  // BGM refが設定されたときの初期化（useEffectは不要）
  const initBgmAudio = useCallback((audioElement) => {
    if (audioElement) {
      audioElement.volume = bgmVolume
      audioElement.loop = true
      bgmAudioRef.current = audioElement
    }
  }, [bgmVolume])

  // ウェルカムモーダルを閉じる
  const handleCloseWelcomeModal = useCallback(() => {
    setShowWelcomeModal(false)
    // localStorageに訪問済みフラグを保存
    localStorage.setItem('hasVisitedBefore', 'true')
  }, [])

  // ウェルカムモーダルを開く（使い方ボタン用）
  const handleOpenWelcomeModal = useCallback(() => {
    setShowWelcomeModal(true)
  }, [])

  // 深呼吸モーダルを閉じる
  const handleCloseBreathingModal = useCallback(() => {
    setShowBreathingModal(false)
  }, [])

  return (
    <div className={`min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 ${!isHeaderVisible ? 'focus-mode' : ''}`}>
      <Analytics />
      
      {/* BGM用のaudio要素（非表示） */}
      <audio 
        ref={initBgmAudio}
        src="/music/jungle-waves-drumampbass-electronic-inspiring-promo-345013.mp3"
        preload="auto"
      />
      
      {/* 目標達成時の効果音用のaudio要素（非表示） */}
      <audio 
        ref={goalAchievedSoundRef}
        src="/music/audiomass-output.mp3"
        preload="auto"
      />
      
      {/* 集中モード切り替えボタン（画面右上固定） */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* 言語切り替えボタン */}
        <button
          onClick={() => changeLanguage(language === 'ja' ? 'en' : 'ja')}
          className="flex items-center gap-2 px-3 py-2 rounded-full shadow-lg font-semibold text-sm transition-all duration-300 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200"
          title={language === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        >
          <span>{language === 'ja' ? 'EN' : '日本語'}</span>
        </button>
        <button
          onClick={() => setShowUsageModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg font-semibold text-sm transition-all duration-300 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200"
        >
          <span>{t('howToUse')}</span>
        </button>
        <button
          onClick={() => setIsHeaderVisible(!isHeaderVisible)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg font-semibold text-sm transition-all duration-300 ${
            isHeaderVisible 
              ? 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200'
              : 'bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white border-2 border-orange-300'
          }`}
          aria-label={isHeaderVisible ? t('enableFocusMode') : t('disableFocusMode')}
        >
          {isHeaderVisible ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{t('focusMode')}</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" />
              </svg>
              <span>{t('focusModeOn')}</span>
            </>
          )}
        </button>
        
        {/* ヘルプアイコン */}
        <div className="relative group">
          <div className="w-6 h-6 rounded-full bg-gray-400 hover:bg-gray-500 text-white flex items-center justify-center cursor-help transition-colors duration-200 shadow-md">
            <span className="text-sm font-bold">?</span>
          </div>
          
          {/* ツールチップ */}
          <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
            <div className="relative">
              {/* 上向きの三角形 */}
              <div className="absolute -top-5 right-1 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-gray-800"></div>
              <p className="leading-relaxed">
                {isHeaderVisible 
                  ? t('helpTooltipVisible')
                  : t('helpTooltipHidden')
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <header className="bg-white shadow-md border-b-4 border-orange-400 focus-mode-target">
        <div className="max-w-7xl mx-auto px-4 py-2 text-center">
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
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">{t('appName')}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700">
          {t('appDescription')}
        </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          {isCameraEnabled ? (
            <CameraView 
              onScoreUpdate={setCurrentScore}
              isActive={isSessionActive}
              onCameraError={setHasCameraError}
            />
          ) : (
            <div className="relative h-64 md:h-80 bg-gray-100 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center text-gray-500">
              <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13l4 4m0 0l-4 4m4-4H9m4-14l-4 4m0 0l4 4m-4-4h10" />
              </svg>
              <p className="text-sm font-medium">{t('cameraCurrentlyOff')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('cameraCanResume')}</p>
            </div>
          )}
          
          {!hasCameraError && (
            <div className="mt-6 space-y-4">
              {!isSessionActive ? (
                <button 
                  className="w-full py-4 px-8 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-lg rounded-full uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                  onClick={startSession}
                >
                  {t('startSession')}
                </button>
              ) : (
                <button 
                  className="w-full py-4 px-8 bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-bold text-lg rounded-full uppercase tracking-wider shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
                  onClick={endSession}
                >
                  {t('endSession')}
                </button>
              )}
              
              {/* BGMコントロール */}
              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{t('bgm')}</span>
                  <button
                    onClick={toggleBgm}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      isBgmPlaying
                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                    }`}
                  >
                    {isBgmPlaying ? `⏸︎ ${t('pause')}` : `▶︎ ${t('play')}`}
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
                  <span className="text-xs text-gray-500">{t('soundEffects')}</span>
                  <div className="flex items-center gap-2">
                    {/* OFF表示 */}
                    <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                      !isSoundEnabled ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                      <span className="text-xs text-gray-400 font-medium">{t('off')}</span>
                    </div>
                    
                    {/* トグルスイッチ */}
                    <button
                      onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                        isSoundEnabled ? 'bg-gray-400' : 'bg-gray-300'
                      }`}
                      aria-label={isSoundEnabled ? t('disableSound') : t('enableSound')}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                          isSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    
                    {/* ON表示 */}
                    <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                      isSoundEnabled ? 'opacity-100' : 'opacity-40'
                    }`}>
                      <span className="text-xs text-gray-600 font-medium">{t('on')}</span>
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCameraEnabled(prev => {
                    const next = !prev
                    if (next) {
                      setHasCameraError(false)
                    }
                    return next
                  })
                }}
                className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-600 font-medium rounded-lg border border-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-1"
              >
                {isCameraEnabled ? t('cameraOff') : t('cameraOn')}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-200">
          <div className="flex flex-col items-center">            
            {/* 体操の説明カード */}
            <div className="w-full max-w-[800px] mb-6 relative">
              {/* カードコンテンツ（スライドエフェクト付き） */}
              <div className="overflow-hidden">
                <div 
                  key={currentExercise.id}
                  className="animate-slide-in"
                >
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                      {currentExercise.title}
                      </span>
                      <span className="text-sm text-gray-600 font-normal ml-2">
                        {currentExercise.description}
                      </span>
                    </h3>
                  </div>
                  
                  {currentExercise.comingSoon ? (
                    <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-orange-200 bg-gray-100 flex items-center justify-center" style={{ minHeight: '400px' }}>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-400 mb-2">{t('comingSoon')}</div>
                        <div className="text-lg text-gray-500">{t('newContentComing')}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-orange-200">
                        <video 
                          ref={videoRef}
                          key={currentExercise.videoUrl}
                          src={currentExercise.videoUrl}
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          className="w-full h-auto"
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                        {/* 一時停止ボタン */}
                        <button
                          onClick={toggleVideo}
                          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                          aria-label={isVideoPaused ? t('playVideo') : t('pauseVideo')}
                        >
                          {isVideoPaused ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setShowModal(true)}
                        className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                      >
                        {t('viewDetails')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* カードナビゲーション */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={handlePreviousExercise}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                  aria-label={language === 'ja' ? '前の体操' : 'Previous exercise'}
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
                  aria-label={language === 'ja' ? '次の体操' : 'Next exercise'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('currentScore')}</h2>

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
                <span className="font-semibold text-orange-600">{t('sessionActive')}</span>
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
              {t('congratulations')}
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
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-400 to-yellow-400 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{currentExercise.title} {t('exerciseDetails')}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-3xl font-bold transition-colors"
                  aria-label={t('close')}
                >
                  ×
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 space-y-6">
              <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-orange-200 max-w-[600px] mx-auto">
                <video 
                  ref={modalVideoRef}
                  src={currentExercise.videoUrl}
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-auto"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                {/* 一時停止ボタン */}
                <button
                  onClick={toggleModalVideo}
                  className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200"
                  aria-label={isModalVideoPaused ? t('playVideo') : t('pauseVideo')}
                >
                  {isModalVideoPaused ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* 解説セクション */}
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-xl font-bold text-orange-600 mb-2 flex items-center gap-2">
                    {t('effects')}
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
                    {t('howTo')}
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
                    {t('points')}
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
                    {t('recommendedTiming')}
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
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使い方モーダル */}
      {showUsageModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
          onClick={() => setShowUsageModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-400 to-yellow-400 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('usageModalTitle')}</h2>
                <button
                  onClick={() => setShowUsageModal(false)}
                  className="text-white hover:text-gray-200 text-3xl font-bold transition-colors"
                  aria-label={t('close')}
                >
                  ×
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="bg-orange-50 rounded-lg p-6 border-2 border-orange-200">
                  <h3 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
                    📸 {t('usageStep1')}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t('usageStep1Desc')}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                    🏃 {t('usageStep2')}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {t('usageStep2Desc')}
                  </p>
                </div>
              </div>

              {/* 閉じるボタン */}
              <button
                onClick={() => setShowUsageModal(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-lg rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 深呼吸モーダル */}
      {showBreathingModal && (
        <BreathingModal onClose={handleCloseBreathingModal} />
      )}

      {/* フッター */}
      <footer className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-t border-orange-100 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <a
            href="https://forms.gle/MSMAxVFRGtB524AN6"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 font-medium transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t('contact')}</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
