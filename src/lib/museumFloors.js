// Toạ độ theo hệ viewBox 0 0 600 420 (đơn vị "mét quy ước"), mô phỏng bản vẽ mặt bằng
// kiến trúc thật: các phòng có kích thước lệch nhau, hành lang trung tâm, cửa ra vào.
export const FLOORS = {
  tret: {
    label: 'Tầng trệt',
    building: { x: 40, y: 40, w: 520, h: 340 },
    corridor: { x: 40, y: 175, w: 520, h: 70 },
    rooms: [
      { id: '101', name: 'Sảnh chính', x: 40, y: 40, w: 150, h: 135 },
      { id: '102', name: 'Phòng gốm sứ cổ', x: 190, y: 40, w: 150, h: 135 },
      {
        id: '103',
        name: 'Phòng khảo cổ Sài Gòn xưa',
        x: 340,
        y: 40,
        w: 220,
        h: 135,
        current: true,
      },
      { id: '104', name: 'Phòng Chăm — Óc Eo', x: 40, y: 245, w: 170, h: 135 },
      {
        id: '105',
        name: 'Phòng Địa lý & Địa chất Gia Định',
        x: 210,
        y: 245,
        w: 190,
        h: 135,
        next: true,
      },
      { id: '107', name: 'Phòng chuyên đề', x: 400, y: 245, w: 160, h: 135 },
    ],
    doors: [
      { x: 190, y: 175, rot: 90 },
      { x: 340, y: 175, rot: 90 },
      { x: 210, y: 245, rot: 90 },
      { x: 400, y: 245, rot: 90 },
      { x: 290, y: 380, rot: 0 },
    ],
    entrance: { x: 270, y: 380, w: 60 },
    routePath: [
      [450, 175],
      [450, 210],
      [305, 210],
      [305, 245],
    ],
    route: [
      { room: 'Phòng khảo cổ Sài Gòn xưa', meta: 'Đang tham quan · 6 phòng', active: true },
      { room: 'Phòng Địa lý & Địa chất Gia Định', meta: '5 phút · Tiếp theo', active: false },
    ],
  },
  lau1: {
    label: 'Tầng lầu 1',
    building: { x: 40, y: 40, w: 520, h: 340 },
    corridor: { x: 40, y: 175, w: 520, h: 70 },
    rooms: [
      { id: '201', name: 'Sảnh trưng bày ảnh', x: 40, y: 40, w: 170, h: 135 },
      { id: '204', name: 'Phòng mỹ thuật Nam Bộ', x: 210, y: 40, w: 180, h: 135, current: true },
      { id: '205', name: 'Phòng trang phục lễ hội', x: 390, y: 40, w: 170, h: 135, next: true },
      { id: '207', name: 'Phòng thương cảng Sài Gòn', x: 40, y: 245, w: 190, h: 135 },
      { id: '208', name: 'Phòng kháng chiến', x: 230, y: 245, w: 170, h: 135 },
      { id: '210', name: 'Phòng tư liệu ảnh', x: 400, y: 245, w: 160, h: 135 },
    ],
    doors: [
      { x: 210, y: 175, rot: 90 },
      { x: 390, y: 175, rot: 90 },
      { x: 230, y: 245, rot: 90 },
      { x: 400, y: 245, rot: 90 },
      { x: 290, y: 380, rot: 0 },
    ],
    entrance: { x: 270, y: 380, w: 60 },
    routePath: [
      [300, 175],
      [300, 210],
      [480, 210],
      [480, 175],
    ],
    route: [
      { room: 'Phòng mỹ thuật Nam Bộ', meta: 'Đang tham quan · 4 phòng', active: true },
      { room: 'Phòng trang phục lễ hội', meta: '4 phút · Tiếp theo', active: false },
    ],
  },
}

