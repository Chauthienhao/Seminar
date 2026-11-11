/**
 * Báo cho backend biết thiết bị này đang mở website, để trang Tổng quan CMS hiện
 * "số thiết bị đang truy cập" (backend: services/presence_service.py).
 *
 * - device_id lưu ở localStorage nên mọi tab trên cùng trình duyệt chỉ tính là 1 thiết bị.
 * - Gửi heartbeat mỗi 30 giây khi tab đang hiển thị; tab ẩn thì ngừng gửi, sau ~75 giây
 *   backend tự không tính thiết bị đó nữa.
 */
import { useEffect } from 'react'

import { api } from './api.js'

const DEVICE_KEY = 'museum_device_id'
const HEARTBEAT_MS = 30_000

function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    // localStorage bị chặn (chế độ riêng tư...) -> dùng id tạm cho phiên này
    getDeviceId.fallback ??= crypto.randomUUID()
    return getDeviceId.fallback
  }
}

export function usePresenceHeartbeat() {
  useEffect(() => {
    const deviceId = getDeviceId()
    const beat = () => {
      if (document.visibilityState !== 'visible') return
      api.sendHeartbeat(deviceId).catch(() => {}) // lỗi mạng không ảnh hưởng trải nghiệm khách
    }

    beat()
    const timer = setInterval(beat, HEARTBEAT_MS)
    document.addEventListener('visibilitychange', beat)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', beat)
    }
  }, [])
}
