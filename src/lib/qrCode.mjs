/**
 * Nội dung mã QR dán tại hiện vật là một đường link cố định:  <PUBLIC_URL>/q/<qr_code>
 * (VD: https://baotang.example/q/SG-1822). Quét bằng camera điện thoại sẽ mở thẳng link đó;
 * trình quét trong website thì chỉ lấy phần <qr_code> ở cuối.
 *
 * KHÔNG đổi đường dẫn /q/ về sau: các tờ QR đã in và dán sẽ hỏng.
 */

export const QR_PATH_PREFIX = '/q/';

// Khớp cột artifacts.qr_code VARCHAR(50); chỉ nhận ký tự an toàn để mã thô không thể là link lạ
const RAW_CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,49}$/;

/** Link in trong mã QR của một hiện vật. */
export function qrLinkFor(publicUrl, qrCode) {
  return `${String(publicUrl).replace(/\/+$/, '')}${QR_PATH_PREFIX}${encodeURIComponent(qrCode)}`;
}

/**
 * Lấy mã hiện vật từ nội dung đọc được trong QR. Chấp nhận:
 *   - link bất kỳ tên miền có đường dẫn /q/<mã> (kể cả QR in lúc còn chạy localhost)
 *   - mã thô, VD "SG-1822" (QR in trước đây hoặc người dùng tự tạo)
 * Trả về null nếu không phải mã QR của bảo tàng.
 */
export function extractQrCode(text) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return null;
  if (RAW_CODE.test(value)) return value;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const match = url.pathname.match(/^\/q\/([^/]+)\/?$/);
  if (!match) return null;
  let code;
  try {
    code = decodeURIComponent(match[1]).trim();
  } catch {
    return null;
  }
  return RAW_CODE.test(code) ? code : null;
}
