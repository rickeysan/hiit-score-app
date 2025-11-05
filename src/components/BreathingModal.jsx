import React, { useState, useEffect } from 'react'

export default function BreathingModal({ onClose }) {
  const [timeLeft, setTimeLeft] = useState(10)
  const progress = ((10 - timeLeft) / 10) * 100

  useEffect(() => {
    // 10秒後に自動的に閉じる
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer)
          onClose()
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [onClose])

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10002] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 text-white p-8 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">お疲れ様でした！</h2>
              <p className="text-white/90 text-lg">
                仕上げにゆっくり深呼吸をしましょう
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold transition-colors ml-4 flex-shrink-0"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-8 space-y-6">
          {/* 画像表示 */}
          <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-blue-200">
            <img 
              src="/image/26187966.jpg" 
              alt="深呼吸のイメージ"
              className="w-full h-auto"
            />
          </div>

          {/* プログレスバー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">自動的に閉じます</span>
              <span className="text-blue-600 font-bold tabular-nums">
                {Math.ceil(timeLeft)}秒
              </span>
            </div>
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="w-full py-4 px-8 bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <span>閉じる</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

