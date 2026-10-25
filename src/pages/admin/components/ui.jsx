import { Loader2 } from 'lucide-react'

/**
 * Các khối giao diện nhỏ dùng chung cho mọi trang CMS — giữ cùng một kiểu ô nhập,
 * nút bấm, thay vì lặp lại chuỗi class Tailwind dài ở từng form.
 */

export const inputClass =
  'w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-maroon disabled:bg-sand/40 disabled:text-ink-soft'

export function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-ink">
        {label} {required && <span className="text-maroon">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}

const VARIANTS = {
  primary: 'bg-maroon text-cream hover:bg-maroon-700',
  secondary: 'border border-ink/15 bg-paper text-ink hover:border-maroon hover:text-maroon',
  danger: 'border border-maroon/30 text-maroon hover:bg-maroon/10',
  ghost: 'text-ink-soft hover:bg-sand/60 hover:text-ink',
}

export function Button({ variant = 'primary', loading = false, disabled, children, className = '', ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

export function IconButton({ label, variant = 'ghost', className = '', children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function LoadingRow({ text = 'Đang tải dữ liệu...' }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-ink-soft">
      <Loader2 size={16} className="animate-spin" /> {text}
    </p>
  )
}

export function ErrorBox({ message }) {
  if (!message) return null
  return <div className="mb-4 rounded-xl border border-maroon/30 bg-maroon/5 p-4 text-sm text-maroon">{message}</div>
}

// Ô số trống -> null (để backend xoá giá trị), ngược lại ép sang Number
export const toNumberOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
// Ô chữ trống -> null, tránh lưu chuỗi rỗng vào DB
export const toTextOrNull = (v) => (v && v.trim() ? v.trim() : null)
