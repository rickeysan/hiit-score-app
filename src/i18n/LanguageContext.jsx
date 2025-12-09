import React, { createContext, useContext, useState, useEffect } from 'react'
import { translations } from './translations'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // localStorageから言語設定を読み込む、なければブラウザの言語に基づいて決定
    const saved = localStorage.getItem('language')
    if (saved && (saved === 'ja' || saved === 'en')) {
      return saved
    }
    // ブラウザの言語設定を確認
    const browserLang = navigator.language || navigator.userLanguage
    return browserLang.startsWith('ja') ? 'ja' : 'en'
  })

  useEffect(() => {
    // 言語設定をlocalStorageに保存
    localStorage.setItem('language', language)
    // HTMLのlang属性を更新
    document.documentElement.lang = language
    // タイトルを更新
    document.title = translations[language]?.appName || 'Sukima Fit'
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || key
  }

  const changeLanguage = (lang) => {
    if (lang === 'ja' || lang === 'en') {
      setLanguage(lang)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

