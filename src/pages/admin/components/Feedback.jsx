import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from './ui.jsx'

/**
 * Thông báo (toast) + hộp xác nhận dùng chung cho toàn khu CMS.
 *   const toast = useToast();     toast.success('Đã lưu') / toast.error(err.message)
 *   const confirm = useConfirm(); if (await confirm({ title, message })) { ...xoá... }
 */

const ToastContext = createContext(null)
const ConfirmContext = createContext(null)

const TOAST_MS = 3500

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const nextId = useRef(0)

  const push = useCallback((type, message) => {
    const id = ++nextId.current
    setToasts((list) => [...list, { id, type, message }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), TOAST_MS)
  }, [])

  const toast = useRef({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
  }).current

  const confirm = useCallback(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    [],
  )

  const closeDialog = (result) => {
    dialog.resolve(result)
    setDialog(null)
  }

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${
                t.type === 'success'
                  ? 'border-emerald-700/20 bg-emerald-50 text-emerald-900'
                  : 'border-maroon/30 bg-[#FBEDEA] text-maroon-700'
              }`}
            >
              {t.type === 'success' ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        {dialog && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-navy-900/50 px-4">
            <div role="alertdialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-cream p-6 shadow-xl">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon/10 text-maroon">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">{dialog.title}</h2>
                  {dialog.message && <p className="mt-1 text-sm text-ink-soft">{dialog.message}</p>}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => closeDialog(false)}>
                  Huỷ
                </Button>
                <Button onClick={() => closeDialog(true)} autoFocus>
                  {dialog.confirmLabel || 'Xoá'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export const useConfirm = () => useContext(ConfirmContext)
