/**
 * Chữ giao diện tiếng Việt cho site khách tham quan.
 * Thêm/sửa câu ở đây thì nhớ thêm key tương ứng trong en.js (thiếu thì site tự hiện bản tiếng Việt).
 */
export default {
  meta: {
    title: 'Bảo tàng Thành phố Hồ Chí Minh | Audio Guide & Digital Map',
  },

  common: {
    loading: 'Đang tải...',
    networkError: 'Không thể kết nối tới máy chủ.',
    networkRetry: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    serverDown: 'Không kết nối được máy chủ, vui lòng thử lại sau.',
    backToLookup: '← Quay lại trang Tra cứu hiện vật',
    artifactCount: '{count} hiện vật',
  },

  header: {
    museumName: 'BẢO TÀNG THÀNH PHỐ HỒ CHÍ MINH',
    switchLang: 'Đổi ngôn ngữ',
    openMenu: 'Mở menu',
    language: 'Ngôn ngữ',
  },

  nav: {
    home: 'Trang chủ',
    lookup: 'Tra cứu hiện vật',
    map: 'Bản đồ tham quan',
    tours: 'Bộ sưu tập & Lộ trình',
  },

  footer: {
    museumName: 'Bảo tàng Thành phố Hồ Chí Minh',
    about:
      'Tòa nhà Gia Long cổ kính mang dấu ấn di sản kiến trúc, lịch sử đặc sắc của đất Sài Gòn — TP Hồ Chí Minh hơn 300 năm hình thành và phát triển.',
    explore: 'Khám phá',
    featuredArtifacts: 'Hiện vật nổi bật',
    featuredCollections: 'Bộ sưu tập nổi bật',
    map2d: 'Bản đồ 2D',
    support: 'Hỗ trợ',
    lookup: 'Tra cứu hiện vật',
    faq: 'Câu hỏi thường gặp',
    help: 'Giúp đỡ',
    contact: 'Thông tin liên hệ',
    address: '65 Lý Tự Trọng, Bến Nghé, Quận 1, TP Hồ Chí Minh',
    copyright: '© {year} Bảo tàng Thành phố Hồ Chí Minh. Thiết kế bản đường trải nghiệm cho người cao tuổi.',
    terms: 'Điều khoản sử dụng',
    privacy: 'Chính sách bảo mật',
  },

  home: {
    eyebrow: 'Hệ thống thuyết minh tự động song ngữ',
    heroTitle: 'Lắng nghe câu chuyện lịch sử Sài Gòn xưa',
    heroDesc:
      'Chào mừng quý khách đến với Bảo tàng Thành phố Hồ Chí Minh. Ứng dụng thuyết minh tự động (Audio Guide) giúp bạn tự do khám phá kho tàng di sản qua chiếc điện thoại cá nhân bằng hai ngôn ngữ Việt – Anh.',
    ctaLookup: 'Tra cứu hiện vật ngay',
    ctaCollections: 'Xem bộ sưu tập',
    heroImageAlt: 'Trụ sở Bảo tàng Thành phố Hồ Chí Minh, tòa nhà Gia Long',
    stepsTitle: 'Hướng dẫn 3 bước sử dụng đơn giản',
    stepsSubtitle: 'Không cần tải ứng dụng, thao tác ngay trên trình duyệt web',
    steps: [
      {
        title: 'Quét mã QR hiện vật',
        desc: 'Tìm các thẻ QR được gắn cạnh tủ trưng bày hiện vật. Dùng camera trên ứng dụng di động (sắp ra mắt) để quét, hoặc tra cứu bằng mã trên website.',
      },
      {
        title: 'Chọn ngôn ngữ & Nghe',
        desc: 'Hệ thống thuyết minh sẽ tự phát nội dung. Bạn có thể chọn chuyển sang tiếng Việt hoặc tiếng Anh (VI/EN) mọi lúc.',
      },
      {
        title: 'Khám phá theo lộ trình',
        desc: 'Dựa trên vị trí bạn tham quan, hệ thống sẽ gợi ý các lộ trình phù hợp giúp bạn khám phá trọn vẹn bảo tàng.',
      },
    ],
    featuredEyebrow: 'Bảo vật & Chủ đề nổi bật',
    featuredTitle: 'Hiện vật không thể bỏ qua',
    seeAllCollections: 'Xem tất cả bộ sưu tập',
    loadingArtifacts: 'Đang tải hiện vật...',
    noArtifacts: 'Chưa có dữ liệu hiện vật. Hãy chạy DB.sql rồi seed_data.sql để tạo dữ liệu mẫu.',
    infoTitle: 'Thông tin tham quan thực tế',
    infoDesc:
      'Hãy đăng ký trực tiếp nhân viên bảo tàng để hỗ trợ vay và kết hợp cùng hệ thống thuyết minh thông minh của chúng tôi để trải nghiệm trọn vẹn nhất khi tham quan.',
    openingHours: 'Giờ mở cửa: 08:00 – 17:00 (Hằng ngày, kể cả Lễ, Tết)',
    address: 'Địa chỉ: 65 Lý Tự Trọng, Quận 1, TP Hồ Chí Minh',
    ticketLocal: 'Vé khách Việt Nam',
    ticketLocalNote: 'Giảm 50% cho học sinh, sinh viên. Miễn phí cho người cao tuổi và trẻ em.',
    ticketForeign: 'Vé khách quốc tế',
    ticketForeignNote: 'Miễn phí truy cập hệ thống thuyết minh Audio Guide đi kèm.',
  },

  lookup: {
    eyebrow: 'Tra cứu hiện vật',
    title: 'Tìm hiện vật bạn đang quan tâm',
    desc: 'Nhập mã hoặc tên hiện vật để xem thông tin chi tiết và nghe thuyết minh — phù hợp khi bạn tra cứu trước chuyến đi hoặc xem lại tại nhà bằng máy tính.',
    placeholder: 'Nhập mã hoặc tên hiện vật (Ví dụ: SG-1822)...',
    submit: 'Tra cứu',
    scanQr: 'Quét mã QR',
    notFound: 'Không tìm thấy hiện vật với mã "{code}". Bạn có thể chọn từ danh sách bên dưới.',
    atMuseumTitle: 'Đang tham quan tại bảo tàng?',
    atMuseumBefore: 'Mỗi điểm tham quan có một mã QR dán bên cạnh. Quét bằng',
    atMuseumCamera: 'camera điện thoại',
    atMuseumMiddle: 'để mở thẳng trang thuyết minh, hoặc bấm',
    atMuseumAfter: 'để dùng camera của máy này.',
    resultsFor: 'Kết quả cho "{query}"',
    mostViewed: 'Hiện vật được xem nhiều',
    loadingList: 'Đang tải dữ liệu từ máy chủ...',
    noResults: 'Không tìm thấy hiện vật phù hợp. Hãy thử mã hoặc từ khoá khác.',
  },

  artifact: {
    loading: 'Đang tải thông tin hiện vật...',
    notFoundTitle: 'Không tìm thấy hiện vật này',
    notFoundDesc: 'Mã hiện vật không tồn tại hoặc đã bị gỡ khỏi hệ thống.',
    networkTitle: 'Không thể kết nối tới máy chủ',
    narration: 'Thuyết minh',
    sourceTts: '(giọng AI tổng hợp)',
    sourceRecorded: '(giọng thu sẵn)',
    rewind: 'Lùi 10 giây',
    forward: 'Tiến 10 giây',
    pause: 'Tạm dừng',
    play: 'Phát',
    favorite: 'Yêu thích hiện vật',
    share: 'Chia sẻ tư liệu',
    location: 'Vị trí',
    versionVi: 'Bản tiếng Việt',
    versionEn: 'English Version',
    // Chỉ hiện khi khách đang chọn VI mà hiện vật chưa có bản VI (backend trả bản có sẵn)
    missingTranslation: 'Hiện vật này chưa có bản tiếng Việt — đang hiển thị bản có sẵn.',
    transcript: 'Toàn văn thuyết minh (Transcript)',
  },

  poi: {
    loading: 'Đang tải điểm tham quan...',
    notFound: 'Không tìm thấy điểm tham quan này',
    artifactsHere: 'Hiện vật tại điểm này ({count})',
  },

  qr: {
    opening: 'Đang mở điểm tham quan {code}...',
    invalid: 'Mã QR này không phải mã của bảo tàng.',
    notFound: 'Không tìm thấy điểm tham quan với mã "{code}". Mã có thể đã bị gỡ hoặc in sai.',
    lookupByCode: 'Tra cứu hiện vật bằng mã',
  },

  scanner: {
    dialogLabel: 'Quét mã QR',
    title: 'Quét mã QR hiện vật',
    close: 'Đóng',
    errInsecure: 'Trình duyệt chỉ cho dùng camera trên trang https hoặc localhost.',
    errDenied:
      'Bạn chưa cho phép website dùng camera. Bấm biểu tượng camera trên thanh địa chỉ để cho phép, rồi mở lại.',
    errNoCamera: 'Không tìm thấy camera trên máy này.',
    errBusy: 'Camera đang được ứng dụng khác sử dụng (Zoom, Teams...). Hãy tắt ứng dụng đó rồi thử lại.',
    errGeneric: 'Không mở được camera.',
    starting: 'Đang mở camera...',
    done: 'Đã đọc mã, đang mở điểm tham quan...',
    hint: 'Đưa mã QR dán tại điểm tham quan vào giữa khung hình, giữ yên khoảng 1–2 giây.',
    chooseCamera: 'Chọn camera',
    chooseCameraPlaceholder: 'Chọn camera...',
    camera: 'Camera {n}',
    fromImage: 'Chọn ảnh có mã QR',
    noQrInImage: 'Không tìm thấy mã QR trong ảnh. Hãy chọn ảnh rõ nét, chụp thẳng mã QR.',
    fallback: 'Không quét được? Đóng cửa sổ này và nhập mã in dưới mã QR (VD: SG-1822) vào ô tra cứu.',
  },

  tours: {
    title: 'Kho tàng tư liệu & Tour tham quan',
    desc: 'Khám phá các lộ trình tour tham quan có sẵn của bảo tàng — bấm vào một tour để xem các điểm dừng theo thứ tự.',
    searchPlaceholder: 'Tìm kiếm tour theo tên...',
    featured: 'Lộ trình tour có sẵn nổi bật',
    loading: 'Đang tải danh sách tour...',
    duration: 'Thời lượng {minutes} phút',
    stops: '{count} điểm dừng',
    loadingStops: 'Đang tải điểm dừng...',
    noStops: 'Tour này chưa có điểm dừng nào.',
    noResults: 'Không tìm thấy tour phù hợp. Hãy thử từ khoá khác.',
  },

  map: {
    ariaLabel: 'Bản đồ điểm tham quan',
    resetButton: 'Về bảo tàng',
    resetTitle: 'Trở về khu vực điểm tham quan trong bảo tàng',
    noImage: 'Chưa có ảnh',
    artifactsHere: 'Hiện vật tại điểm này ({count})',
    poiCode: 'Mã điểm (QR)',
    noCode: 'Chưa có mã',
    room: 'Phòng',
    noRoom: 'Chưa có thông tin phòng',
    noDescription: 'Chưa có mô tả.',
    viewDetails: 'Xem chi tiết',
    viewPoi: 'Xem điểm tham quan',
    loading: 'Đang tải điểm tham quan…',
    loadFailed: 'Không tải được bản đồ. Vui lòng thử lại.',
    retry: 'Thử lại',
    empty: 'Chưa có điểm tham quan có vị trí trong khu vực bảo tàng để hiển thị.',
    defaultPoiTitle: 'Điểm tham quan',
    defaultArtifactTitle: 'Hiện vật',
  },
}
