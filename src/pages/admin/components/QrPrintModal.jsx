import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Loader2, Printer, TriangleAlert } from 'lucide-react'

import { PUBLIC_URL, PUBLIC_URL_IS_LOCAL } from '../../../lib/publicUrl.js'
import { qrLinkFor } from '../../../lib/qrCode.mjs'
import Modal from './Modal.jsx'
import { Button, ErrorBox } from './ui.jsx'

/**
 * Ảnh QR KHÔNG lưu ở đâu cả: chỉ cột pois.code được lưu, ảnh được vẽ lại từ link
 * <PUBLIC_URL>/q/<code> mỗi lần mở. Cùng nội dung luôn ra cùng một mã, nên in lại bao nhiêu
 * lần thì tờ QR đã dán ở bảo tàng vẫn đúng.
 */

const LABEL_WIDTH = 720
const QR_SIZE = 600

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

// Cắt chữ dài thành nhiều dòng vừa khổ nhãn (tối đa `maxLines`, dòng cuối thêm "…")
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    let last = lines[maxLines - 1]
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last}…`
  }
  return lines
}

/** Nhãn PNG để in/dán: mã QR + mã điểm tham quan (để khách gõ tay khi không quét được) + tên điểm. */
async function renderLabel(qrDataUrl, code, title) {
  const qr = await loadImage(qrDataUrl)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = '600 34px Arial, sans-serif'
  const titleLines = title ? wrapText(ctx, title, LABEL_WIDTH - 80, 2) : []
  canvas.width = LABEL_WIDTH
  canvas.height = 60 + QR_SIZE + 70 + titleLines.length * 44 + 50

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(qr, (LABEL_WIDTH - QR_SIZE) / 2, 40, QR_SIZE, QR_SIZE)
  ctx.fillStyle = '#111111'
  ctx.textAlign = 'center'
  ctx.font = '700 48px Arial, sans-serif'
  ctx.fillText(code, LABEL_WIDTH / 2, 40 + QR_SIZE + 70)
  ctx.font = '600 34px Arial, sans-serif'
  ctx.fillStyle = '#333333'
  titleLines.forEach((line, i) => ctx.fillText(line, LABEL_WIDTH / 2, 40 + QR_SIZE + 130 + i * 44))
  return canvas.toDataURL('image/png')
}

function printLabel(labelDataUrl, code) {
  // In qua iframe ẩn để không phải in cả giao diện CMS
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>QR ${escapeHtml(code)}</title>
<style>@page{margin:12mm}html,body{margin:0}body{display:flex;justify-content:center}
img{width:80mm;height:auto}</style></head><body><img src="${labelDataUrl}" alt=""></body></html>`)
  doc.close()
  const img = doc.querySelector('img')
  const run = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => iframe.remove(), 1000)
  }
  if (img.complete) run()
  else img.onload = run
}

export default function QrPrintModal({ code, title, onClose }) {
  const [label, setLabel] = useState(null)
  const [error, setError] = useState(null)
  const link = qrLinkFor(PUBLIC_URL, code)

  useEffect(() => {
    let active = true
    setLabel(null)
    setError(null)
    QRCode.toDataURL(link, { width: QR_SIZE, margin: 2, errorCorrectionLevel: 'M' })
      .then((qrDataUrl) => renderLabel(qrDataUrl, code, title))
      .then((png) => active && setLabel(png))
      .catch(() => active && setError('Không tạo được mã QR. Vui lòng thử lại.'))
    return () => {
      active = false
    }
  }, [link, code, title])

  return (
    <Modal title={`Mã QR điểm tham quan ${code}`} onClose={onClose} size="max-w-md">
      <ErrorBox message={error} />

      <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-ink/10 bg-white p-3">
        {label ? (
          <img src={label} alt={`Mã QR của điểm tham quan ${code}`} className="w-full max-w-[280px]" />
        ) : (
          !error && <Loader2 size={20} className="animate-spin text-ink-soft" />
        )}
      </div>

      <p className="mt-3 break-all text-center text-xs text-ink-soft">
        Mã QR mở link: <span className="font-semibold text-ink">{link}</span>
      </p>

      {PUBLIC_URL_IS_LOCAL && (
        <p className="mt-3 flex gap-2 rounded-lg border border-maroon/30 bg-maroon/5 p-3 text-xs text-maroon">
          <TriangleAlert size={16} className="shrink-0" />
          <span>
            Link đang dùng địa chỉ <strong>localhost</strong>: chỉ mở được trên máy này. Quét bằng nút “Quét mã QR”
            trên website vẫn đúng điểm tham quan, nhưng camera điện thoại sẽ không mở được. Trước khi in để dán thật, đặt{' '}
            <code>VITE_PUBLIC_URL</code> trong file <code>.env</code> là địa chỉ website thật.
          </span>
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-ink/10 pt-4">
        <a
          href={label || undefined}
          download={`QR-${code}.png`}
          aria-disabled={!label}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-maroon hover:text-maroon ${
            label ? '' : 'pointer-events-none opacity-60'
          }`}
        >
          <Download size={14} /> Tải PNG
        </a>
        <Button onClick={() => printLabel(label, code)} disabled={!label}>
          <Printer size={14} /> In
        </Button>
      </div>
    </Modal>
  )
}
