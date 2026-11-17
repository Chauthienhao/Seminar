/**
 * Đa ngôn ngữ (VI/EN) cho site khách tham quan.
 *
 * - <LanguageProvider> giữ ngôn ngữ đang chọn cho TOÀN site (bọc ngoài <App /> trong main.jsx).
 * - useLang() -> { lang, setLang, toggleLang, t }
 *     t('nav.home')                  -> chữ giao diện theo ngôn ngữ hiện tại (lấy từ src/locales/*.js)
 *     t('lookup.notFound', { code }) -> thay {code} trong câu
 * - pick(obj, 'name', lang)          -> obj.name_en / obj.name_vi cho dữ liệu từ DB (phòng, POI, tour)
 *
 * Ngôn ngữ được lưu vào localStorage nên khách tải lại trang hay quét QR sang trang khác vẫn giữ lựa chọn.
 * Lần đầu vào web: trình duyệt tiếng Việt -> VI, còn lại -> EN.
 * Khu CMS (/admin) không dùng các hàm này nên luôn là tiếng Việt.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import vi from '../locales/vi.js'
import en from '../locales/en.js'

export const SUPPORTED_LANGS = ['vi', 'en']
const DICTIONARIES = { vi, en }
const STORAGE_KEY = 'museum_lang'

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (SUPPORTED_LANGS.includes(saved)) return saved
  } catch {
    // localStorage bị chặn (chế độ riêng tư...) -> đoán theo trình duyệt
  }
  const browserLang = (typeof navigator !== 'undefined' && navigator.language) || 'vi'
  return browserLang.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

function interpolate(value, vars) {
  if (typeof value !== 'string' || !vars) return value
  return value.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match))
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang)

  const setLang = useCallback((next) => {
    if (!SUPPORTED_LANGS.includes(next)) return
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // không lưu được thì vẫn đổi ngôn ngữ trong phiên hiện tại
    }
  }, [])

  const toggleLang = useCallback(() => setLang(lang === 'vi' ? 'en' : 'vi'), [lang, setLang])

  // Thiếu key ở bản EN -> dùng bản VI, thiếu cả hai -> trả về chính key (dễ phát hiện khi dev)
  const t = useCallback(
    (key, vars) => {
      const value = lookup(DICTIONARIES[lang], key) ?? lookup(DICTIONARIES.vi, key) ?? key
      return interpolate(value, vars)
    },
    [lang],
  )

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t('meta.title')
  }, [lang, t])

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang() phải được dùng bên trong <LanguageProvider>')
  return ctx
}

/** Lấy trường song ngữ của dữ liệu DB: pick(room, 'name', 'en') -> room.name_en (trống thì lùi về name_vi). */
export function pick(obj, field, lang) {
  if (!obj) return ''
  return obj[`${field}_${lang}`] || obj[`${field}_vi`] || ''
}
