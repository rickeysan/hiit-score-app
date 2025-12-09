import React from 'react'
import { useLanguage } from '../i18n/LanguageContext'

export default function WelcomeModal({ onClose }) {
  const { t } = useLanguage()
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10002] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 text-white p-8 rounded-t-3xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <video 
                  src="/work.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  width="60"
                  height="60"
                  className="w-14 h-14 object-contain"
                  style={{ imageRendering: 'crisp-edges' }}
                />
                <h2 className="text-3xl font-bold">{t('welcomeTitle')}</h2>
              </div>
              <p className="text-white/90 text-lg">
                {t('welcomeSubtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold transition-colors ml-4 flex-shrink-0"
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-8 space-y-8">
          {/* アプリの特徴 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">✨</span>
              {t('appFeatures')}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border-2 border-orange-200">
                <div className="text-4xl mb-3">🎥</div>
                <h4 className="font-bold text-orange-600 mb-2">{t('cameraDetection')}</h4>
                <p className="text-sm text-gray-600">
                  {t('cameraDetectionDesc')}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="font-bold text-blue-600 mb-2">{t('scoreExercise')}</h4>
                <p className="text-sm text-gray-600">
                  {t('scoreExerciseDesc')}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="text-4xl mb-3">🔒</div>
                <h4 className="font-bold text-green-600 mb-2">{t('privacyProtection')}</h4>
                <p className="text-sm text-gray-600">
                  {t('privacyProtectionDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* 使い方 */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">📖</span>
              {t('howToUseTitle')}
            </h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
              <ol className="space-y-4">
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{t('step1')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('step1Desc')}
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{t('step2')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('step2Desc')}
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{t('step3')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('step3Desc')}
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">4</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{t('step4')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('step4Desc')}
                    </p>
                  </div>
                </li>
                
                <li className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">5</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 mb-1">{t('step5')}</h4>
                    <p className="text-sm text-gray-600">
                      {t('step5Desc')}
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* ヒント */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">💡</span>
              {t('usefulFeatures')}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-bold text-yellow-700 mb-2">{t('bgmSoundEffects')}</h4>
                <p className="text-sm text-gray-600">
                  {t('bgmSoundEffectsDesc')}
                </p>
              </div>
              
              <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                <h4 className="font-bold text-pink-700 mb-2">{t('focusModeFeature')}</h4>
                <p className="text-sm text-gray-600">
                  {t('focusModeFeatureDesc')}
                </p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-700 mb-2">{t('historyCheck')}</h4>
                <p className="text-sm text-gray-600">
                  {t('historyCheckDesc')}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-bold text-green-700 mb-2">{t('milestones')}</h4>
                <p className="text-sm text-gray-600">
                  {t('milestonesDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* 開始ボタン */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full py-4 px-8 bg-gradient-to-r from-orange-400 to-yellow-400 hover:from-orange-500 hover:to-yellow-500 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-3">
                <span>{t('letsStart')}</span>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <p className="text-center text-sm text-gray-500 mt-3">
              {t('wontShowAgain')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

