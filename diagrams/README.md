# Sơ đồ Activity và Deployment — Museum Audio Guide

Phân tích repository [Chauthienhao/Seminar](https://github.com/Chauthienhao/Seminar), commit `8c484cdf93f529af73ff7737e84cb35d825c215c`, ngày 20/10/2026. Sơ đồ mô tả code tại commit này, không khẳng định hệ thống đã được triển khai trên máy chủ thật.

## Cách đọc

- **Đã có**: logic thực sự tồn tại trong source; không đồng nghĩa đã kiểm thử chạy thực tế.
- **API chưa nối UI**: backend có endpoint nhưng trang React chưa gọi.
- **Dự kiến / đề xuất**: chưa có implementation hoặc cấu hình deployment trong repository; đường nét đứt trong Deployment.
- Activity dùng Mermaid flowchart với nút bắt đầu/kết thúc, quyết định và vùng trách nhiệm. File `deployment.puml` dùng ký pháp UML Deployment chính thức, có node, execution environment, artifact và communication path.

Các file `.mmd` là mã sơ đồ chỉnh sửa được; `.svg` là bản vector đã render. Mở `index.html` để duyệt toàn bộ sơ đồ và phóng to bằng trình duyệt.

## 1. Phạm vi và mức độ hoàn thiện

| Thành phần | Trạng thái thực tế | Bằng chứng |
|---|---|---|
| React 18 + React Router 6 + Vite 5 + Tailwind | Có source frontend | `package.json`, `src/App.jsx` |
| Tra cứu khách | Lọc 3 phần tử mẫu trong bộ nhớ; submit điều hướng bằng slug/chuỗi nhập | `src/pages/ArtifactLookup.jsx` |
| Chi tiết hiện vật | Dùng duy nhất hằng `ARTIFACT`; id chỉ hiển thị | `src/pages/ArtifactDetail.jsx` |
| Phát audio | Chỉ toggle `playing`; không có HTMLAudioElement, thẻ audio, TTS client hay log client | `ArtifactDetail.jsx` |
| Đổi ngôn ngữ | Chỉ thay state/nút được chọn; chưa dịch nội dung hoặc đồng bộ Header | `Header.jsx`, `ArtifactDetail.jsx` |
| Bản đồ | Hai tầng hardcode; current/next/routePath là dữ liệu mẫu | `MuseumMap.jsx` |
| Tour | Lọc 3 tour mẫu theo tiêu đề/chủ đề; link fragment, chưa có route chi tiết tour | `ToursCollections.jsx` |
| CMS | Đăng nhập, lưu token sessionStorage, gọi me + top-played, đăng xuất | `AdminDashboard.jsx` |
| API visitor/admin | Có router, service, repository, ORM, schema | `backend-thuyet-minh/` |
| Mobile QR/GPS | Chưa có project React Native/camera/GPS client | Chỉ được nhắc trong comment/UI |
| TTS | Backend chỉ ghép URL `/synthesize`; không gửi HTTP tới TTS | `AudioService._resolve_audio` |
| Media server | Chỉ lưu URL; chưa có upload, static mount hoặc server stream | `main.py`, `entities.py` |
| Production/CI/CD | Chưa có Dockerfile, compose, pipeline, ingress, cloud manifest | Cây file repository |

## 2. Activity A01 — Khách tham quan trên giao diện hiện tại

```mermaid
flowchart TD
  S((Bắt đầu)) --> H["Mở website / — Home"]
  H --> MENU{"Chọn chức năng"}
  MENU -->|Tra cứu| L["/tra-cuu-hien-vat: đọc POPULAR_ARTIFACTS"]
  L --> Q["Nhập từ khóa: trim + lowercase"]
  Q --> R["useMemo lọc title hoặc code trong mảng mẫu"]
  R --> HAS{"Có kết quả?"}
  HAS -->|Không| EMPTY["Hiện thông báo không tìm thấy"]
  EMPTY --> Q
  HAS -->|Có| LIST["Hiện các NavLink"]
  LIST --> ACT{"Chọn dòng hay submit?"}
  ACT -->|Chọn dòng| NAV["Điều hướng /hien-vat/slug"]
  ACT -->|Submit| BLANK{"query rỗng?"}
  BLANK -->|Có| Q
  BLANK -->|Không| EXACT{"code khớp chính xác?"}
  EXACT -->|Có| NAV
  EXACT -->|Không| RAW["Điều hướng id = encodeURIComponent của chuỗi nhập lowercase"]
  RAW --> D
  MENU -->|Chi tiết mẫu| D["ArtifactDetail: đọc hằng ARTIFACT; id chỉ để hiển thị"]
  NAV --> D
  D --> OPT{"Tương tác"}
  OPT -->|Phát / Dừng| PLAY["Đảo playing; đổi icon — chưa phát audio"]
  OPT -->|VI / EN| LANG["Đổi state lang — nội dung vẫn giữ nguyên"]
  OPT -->|Yêu thích| LIKE["Đảo liked trong bộ nhớ component"]
  OPT -->|Transcript| TEXT["Ẩn / hiện văn bản mẫu"]
  OPT -->|Tiến, lùi, chia sẻ| INERT["Nút chưa gắn handler"]
  PLAY --> OPT
  LANG --> OPT
  LIKE --> OPT
  TEXT --> OPT
  INERT --> OPT
  MENU -->|Bản đồ| MAP["/ban-do: chọn tret hoặc lau1; render FLOORS và routePath mẫu"]
  MAP --> MENU
  MENU -->|Bộ sưu tập| TOUR["/bo-suu-tap: lọc TOURS theo tiêu đề và chủ đề"]
  TOUR --> CLICK["Chọn tour: href #tour-id; chưa có trang tour chi tiết"]
  CLICK --> MENU
  OPT -->|Rời trang| END((Kết thúc))
  MENU -->|Đóng trang| END
```

Không có request API visitor nào trong luồng này. Tìm không thấy mã vẫn có thể mở trang chi tiết mẫu. Không nên trình bày thao tác này như một lần tra cứu thành công từ CSDL.

## 3. Activity A02 — API tìm kiếm, lookup QR và chi tiết hiện vật

API đã có, giao diện khách chưa nối. Swimlane thể hiện ranh giới giữa HTTP, service và CSDL.

```mermaid
flowchart TD
  S((Bắt đầu request)) --> REQ
  subgraph HTTP["FastAPI — visitor.py + dependencies.py"]
    REQ["GET /api/artifacts, /artifacts/lookup/qr_code hoặc /artifacts/id"]
    REQ --> VALID{"Tham số đúng kiểu?"}
    VALID -->|Không| E422["HTTP 422 từ FastAPI / Pydantic"]
    VALID -->|Có| LNG["get_language: vi/en giữ nguyên; khác → vi"]
    LNG --> OPEN["get_db: mở SessionLocal"]
    OPEN --> KIND{"Endpoint nào?"}
  end
  subgraph SVC["AudioService + ArtifactRepository"]
    KIND -->|Danh sách| SEARCH["JOIN translations; lọc language_code; q khớp QR hoặc title"]
    SEARCH --> PAGE["ORDER BY title; offset skip; limit mặc định 20"]
    PAGE --> SUM["Chuyển từng phần tử sang ArtifactSummary"]
    KIND -->|QR| QR["get_by_qr_code: khớp qr_code"]
    KIND -->|ID| ID["get_by_id: khớp id"]
    QR --> FOUND{"Tìm được Artifact?"}
    ID --> FOUND
    FOUND -->|Không| NF["NotFoundError"]
    FOUND -->|Có| DETAIL["_to_detail: chọn bản dịch + resolve URL audio — A03"]
    DETAIL --> CONTENT{"Có bản dịch?"}
    CONTENT -->|Không| NF
    CONTENT -->|Có| OUT["ArtifactDetail: room, translation, available_languages và metadata"]
  end
  subgraph DB["MySQL"]
    TABLES[("artifacts + artifact_translations + rooms")]
  end
  SEARCH -.-> TABLES
  QR -.-> TABLES
  ID -.-> TABLES
  SUM --> OK["HTTP 200: danh sách, có thể rỗng"]
  OUT --> OK2["HTTP 200: chi tiết một hiện vật"]
  NF --> E404["Router đổi sang HTTP 404"]
  OK --> CLOSE["Đóng DB session trong finally"]
  OK2 --> CLOSE
  E404 --> CLOSE
  CLOSE --> E((Kết thúc))
  E422 --> E
```

Danh sách tìm kiếm chỉ lấy hiện vật có translation đúng ngôn ngữ; không dùng fallback ngôn ngữ cho bước lọc SQL. `skip/limit` chưa được khai báo ràng buộc số không âm. Ngoại lệ CSDL chưa có handler nghiệp vụ riêng; có thể trở thành lỗi server. Trường hợp lỗi sau khi mở session vẫn thực hiện `finally` đóng session.

## 4. Activity A03 — Chọn bản dịch và nguồn thuyết minh

```mermaid
flowchart TD
  S((Bắt đầu _to_detail)) --> T{"Có bản dịch đúng language_code?"}
  T -->|Có| MATCH["Chọn bản dịch đúng ngôn ngữ"]
  T -->|Không| ANY{"Có ít nhất một bản dịch?"}
  ANY -->|Không| NF["NotFoundError: chưa có nội dung thuyết minh"]
  NF --> E404["Endpoint detail/lookup trả 404"]
  ANY -->|Có| FIRST["Chọn translations đầu tiên; không bảo đảm đó là tiếng Việt"]
  MATCH --> AUDIO{"audio_url có giá trị?"}
  FIRST --> AUDIO
  AUDIO -->|Có| REC["Giữ URL; audio_source = pre_recorded"]
  AUDIO -->|Không| TXT["Lấy transcript, nếu rỗng lấy title; cắt tối đa 2000 ký tự"]
  TXT --> ENC["URL encode văn bản bằng quote"]
  ENC --> URL["Ghép TTS_SERVICE_URL + /synthesize?text=...&lang=ngôn ngữ bản dịch"]
  URL --> SRC["audio_source = tts"]
  SRC --> RESPONSE["Trả URL trong translation; không gọi HTTP và không ghi URL vào DB"]
  REC --> RESPONSE
  RESPONSE --> META["Kèm available_languages đã sort và thông tin phòng"]
  META --> E((Kết thúc xử lý backend))
  E404 --> E
```

Đây là **resolve URL**, chưa phải hoạt động tổng hợp/phát tiếng nói. Repo chưa có implementation `/synthesize`, hàng đợi audio, chống phát trùng, tự dừng hay retry TTS. Client trong tương lai phải truy cập trực tiếp URL được trả về; `localhost:8001` chỉ đúng khi dịch vụ nằm trên chính máy chạy client.

## 5. Activity A04 — Ghi log lượt nghe

```mermaid
flowchart TD
  S((Client/API caller)) --> POST["POST /api/play-logs — công khai, không JWT"]
  POST --> SCHEMA{"PlayLogCreate hợp lệ về kiểu và trường bắt buộc?"}
  SCHEMA -->|Không| V["422"]
  SCHEMA -->|Có| DB["Mở session; get Artifact theo artifact_id"]
  DB --> FOUND{"Hiện vật tồn tại?"}
  FOUND -->|Không| N["NotFoundError → 404"]
  FOUND -->|Có| LOG["Sinh UUID; gán artifact_id, session_id, trigger_method, language_played, listen_duration"]
  LOG --> INSERT["INSERT play_logs; played_at mặc định CSDL"]
  INSERT --> COMMIT["commit + refresh"]
  COMMIT --> RESP["201 Created: PlayLogOut"]
  RESP --> CLOSE["Đóng session"]
  N --> CLOSE
  CLOSE --> E((Kết thúc))
  V --> E
```

UI hiện chưa gọi endpoint này. Mỗi POST tạo một dòng mới; không có upsert, chống trùng hay ghép sự kiện bắt đầu/kết thúc. `trigger_method` và `language_played` là chuỗi tự do; `listen_duration` chưa có ràng buộc không âm. Do đó `play_count` là số dòng log, chưa bảo đảm là số phiên nghe duy nhất.

## 6. Activity A05 — Đăng nhập, tải Dashboard và đăng xuất CMS

```mermaid
flowchart TD
  S((Mở /admin)) --> TOKEN{"sessionStorage có museum_admin_token?"}
  TOKEN -->|Không| FORM["Hiện LoginForm; username/password required"]
  FORM --> SEND["Submit: loading=true; xóa lỗi; POST /api/admin/login"]
  SEND --> P["Pydantic kiểm tra LoginRequest"]
  P --> USER["AuthService → UserRepository tìm admins.username"]
  USER --> AUTH{"Có user và bcrypt.checkpw đúng?"}
  AUTH -->|Không| FAIL["401; UI hiện lỗi; loading=false"]
  FAIL --> FORM
  AUTH -->|Có| LAST["Cập nhật last_login UTC; commit + refresh"]
  LAST --> JWT["Tạo JWT: sub=user.id; role; exp theo cấu hình, mặc định 120 phút; HS256 mặc định"]
  JWT --> SAVE["200 access_token; lưu sessionStorage và setToken"]
  SAVE --> DASH
  TOKEN -->|Có, chưa xác minh| DASH["Mount Dashboard; loading=true"]
  DASH --> FORK["Promise.all khởi chạy hai request độc lập"]
  FORK --> ME["GET /api/admin/me + Bearer token — A06"]
  FORK --> ST["GET /api/admin/stats/top-played?lang=vi&limit=5 + Bearer token — A07"]
  ME --> JOIN{"Cả hai promise thành công?"}
  ST --> JOIN
  JOIN -->|Có| SET["setMe + setStats; finally loading=false"]
  SET --> ROWS{"stats rỗng?"}
  ROWS -->|Có| EMPTY["Hiện chưa có lượt phát"]
  ROWS -->|Không| RENDER["Hiện top hiện vật, lượt phát, round tổng giây/60"]
  JOIN -->|Không| CODE{"Response 401?"}
  CODE -->|Có| CLEAR["adminRequest xóa token trong storage; throw lỗi hết phiên"]
  CODE -->|Không| ERR["throw lỗi API hoặc mạng"]
  CLEAR --> SHOW["Dashboard setError; loading=false; chưa tự setToken(null)"]
  ERR --> SHOW
  EMPTY --> ACTION
  RENDER --> ACTION
  SHOW --> ACTION{"Thao tác tiếp theo"}
  ACTION -->|Đăng xuất| OUT["Xóa token + setToken(null)"]
  OUT --> FORM
  ACTION -->|Tải lại trang| TOKEN
  ACTION -->|Đóng tab| E((Kết thúc))
```

401 trong request dashboard xóa sessionStorage nhưng không cập nhật state token ở component cha, nên UI chưa tự quay về form ngay. Đăng xuất chỉ xóa token phía browser, chưa có API revoke token. `Promise.all` là xử lý song song; việc một request lỗi không tự hủy request còn lại. `App.jsx` vẫn bọc `/admin` bằng Header/Footer chung dù comment trong CMS nói khác.

## 7. Activity A06 — Cổng xác thực cho các API quản trị

```mermaid
flowchart TD
  S((Request /api/admin trừ login)) --> HDR{"Có HTTP Bearer credentials?"}
  HDR -->|Không| M["401: thiếu token"]
  HDR -->|Có| DEC["jwt.decode với SECRET_KEY và ALGORITHM; kiểm tra exp"]
  DEC --> VALID{"Decode thành công và payload có sub?"}
  VALID -->|Không| I["401: không hợp lệ hoặc hết hạn"]
  VALID -->|Có| LOOK["UserRepository.get_by_id sub → admins"]
  LOOK --> EX{"Tài khoản còn tồn tại?"}
  EX -->|Không| N["401: tài khoản không tồn tại"]
  EX -->|Có| U["UserOut.model_validate; tiếp tục endpoint"]
  U --> OP["Đọc /me, thống kê hoặc ghi dữ liệu CMS"]
  OP --> E((Trả response và đóng session))
  M --> E
  I --> E
  N --> E
```

`require_super_admin` có định nghĩa nhánh 403 nhưng **chưa được router nào sử dụng**. Các API CMS hiện chỉ đòi tài khoản hợp lệ; chưa phân biệt quyền STAFF/SUPER_ADMIN cho thao tác CRUD. Không thêm nhánh phân quyền 403 vào luồng đang chạy.

## 8. Activity A07 — Thống kê Top hiện vật

```mermaid
flowchart TD
  S((GET /api/admin/stats/top-played)) --> AUTH["Xác thực A06; lang mặc định vi; limit mặc định 10"]
  AUTH --> SQL["PlayLogRepository: play_logs JOIN artifacts theo artifact_id"]
  SQL --> TRANS["JOIN artifact_translations theo artifact_id và language_code=lang"]
  TRANS --> GROUP["GROUP BY artifact_id và title"]
  GROUP --> COUNT["COUNT play_logs.id = play_count; COALESCE SUM listen_duration = tổng giây"]
  COUNT --> SORT["ORDER BY COUNT giảm dần; LIMIT"]
  SORT --> OUT["Ánh xạ ArtifactPlayStat; 200 danh sách"]
  OUT --> UI["CMS nhận cùng /me qua Promise.all; render A05"]
  UI --> E((Kết thúc))
```

`lang` của endpoint thống kê không qua `get_language`, không tự chuẩn hóa về vi. Lọc ngôn ngữ áp dụng cho **tiêu đề bản dịch**, không lọc `play_logs.language_played`: lượt phát đang cộng tất cả ngôn ngữ. INNER JOIN bỏ log có `artifact_id=NULL` hoặc hiện vật thiếu bản dịch theo lang. Nếu một hiện vật có nhiều bản dịch cùng language_code thì phép JOIN có thể nhân dòng log; DB chưa có unique constraint cho cặp này.

## 9. Activity A08 — Tạo, sửa, xóa hiện vật qua API CMS

```mermaid
flowchart TD
  S((Request CMS có Bearer)) --> AUTH["Xác thực A06 và validate body; chưa có form CRUD trên UI"]
  AUTH --> MODE{"HTTP method"}
  MODE -->|POST /api/admin/artifacts| CHECK["Tra qr_code"]
  CHECK --> DUP{"QR đã tồn tại?"}
  DUP -->|Có| C409["ConflictError → 409"]
  DUP -->|Không| NEW["Sinh UUID; tạo Artifact từ metadata"]
  NEW --> SAVE["Repository.create: add, commit, refresh hiện vật"]
  SAVE --> LOOP{"Còn translation trong payload?"}
  LOOP -->|Có| TR["Sinh UUID translation; gắn artifact_id và nội dung"]
  TR --> TC["add_translation: commit + refresh từng bản dịch"]
  TC --> LOOP
  LOOP -->|Không| LANG["Chọn ngôn ngữ bản dịch đầu tiên hoặc vi"]
  LANG --> DETAIL["get_detail + resolve URL audio"]
  DETAIL --> HAS{"Có ít nhất một bản dịch?"}
  HAS -->|Có| C201["201 ArtifactDetail"]
  HAS -->|Không| ERROR["NotFoundError không được nhánh create bắt; có thể thành 500 sau khi đã lưu Artifact"]
  MODE -->|PUT /api/admin/artifacts/id| GET["get_by_id"]
  GET --> EXIST{"Tồn tại?"}
  EXIST -->|Không| N404["404"]
  EXIST -->|Có| PATCH["setattr từng field trong model_dump exclude_unset"]
  PATCH --> UP["commit + refresh; _to_detail với vi và fallback"]
  UP --> U200["200 ArtifactDetail; thiếu toàn bộ bản dịch → 404 sau commit"]
  MODE -->|DELETE /api/admin/artifacts/id| DG["get_by_id"]
  DG --> DE{"Tồn tại?"}
  DE -->|Không| N404
  DE -->|Có| DEL["ORM delete + commit; xóa translation/tour links; log giữ lại với FK null"]
  DEL --> D204["204 No Content"]
  C409 --> END((Đóng session / kết thúc))
  C201 --> END
  ERROR --> END
  N404 --> END
  U200 --> END
  D204 --> END
```

PUT chỉ sửa `room_id, lat, lng, geofence_radius, image_url, period`; chưa sửa được QR hoặc translation. Tạo hiện vật và từng translation được commit riêng, không phải một transaction nguyên tử; lỗi ở bước sau có thể để lại dữ liệu đã ghi. Ngoại lệ FK/IntegrityError chưa được chuyển thành 409/422. Không có upload file audio; payload chỉ nhận URL.

## 10. Activity A09 — Phòng và tour công khai qua API

```mermaid
flowchart TD
  S((GET API visitor)) --> LANG["Chuẩn hóa lang khi endpoint có get_language; mở session"]
  LANG --> TYPE{"Tài nguyên"}
  TYPE -->|GET /api/rooms| ROOMS["RoomRepository.list_all: ORDER BY code"]
  ROOMS --> RL["200 list RoomOut"]
  TYPE -->|GET /api/rooms/id| ROOM["Tìm room và room.artifacts"]
  ROOM --> RF{"Có room?"}
  RF -->|Không| N["404"]
  RF -->|Có| RA["Mỗi hiện vật: title đúng lang, nếu thiếu lấy bản đầu, nếu chưa có lấy qr_code"]
  RA --> RD["200 RoomDetail kèm artifacts"]
  TYPE -->|GET /api/tours| TL["TourRepository.list_all: offset 0, limit 50 nội bộ"]
  TL --> TS["Chọn title/description vi hoặc en; stop_count=len stops"]
  TS --> TO["200 list TourSummary"]
  TYPE -->|GET /api/tours/id| TD["Tìm tour; eager load stops, artifact, translations, room"]
  TD --> TF{"Có tour?"}
  TF -->|Không| N
  TF -->|Có| ORDER["Sort tour.stops theo step_order"]
  ORDER --> STOP["Ánh xạ TourStop; title hiện vật fallback bản đầu hoặc qr_code"]
  STOP --> DETAIL["200 TourDetail: summary + stops"]
  RL --> E((Đóng session))
  RD --> E
  TO --> E
  DETAIL --> E
  N --> E
```

Các API này chưa được MuseumMap/ToursCollections gọi. Backend chưa có API dữ liệu hình học mặt bằng theo tầng, định tuyến đường đi, tiến độ tham quan hoặc bộ lọc tour `q/topic` như UI mẫu.

## 11. Activity A10 — Tạo phòng, tạo/xóa tour qua API CMS

```mermaid
flowchart TD
  S((Request CMS)) --> AUTH["A06 + validate payload"]
  AUTH --> OP{"Thao tác"}
  OP -->|POST /api/admin/rooms| R["UUID + code + name_vi + name_en"]
  R --> RC["RoomRepository.create: commit + refresh"]
  RC --> R201["201 RoomOut"]
  OP -->|POST /api/admin/tours| T["UUID + title/description vi/en + duration + thumbnail"]
  T --> TC["TourRepository.create: commit + refresh Tour"]
  TC --> LOOP{"Còn artifact_id trong artifact_ids_in_order?"}
  LOOP -->|Có| LINK["enumerate bắt đầu 1 → TourArtifact: tour_id, artifact_id, step_order"]
  LINK --> LC["add_stop: commit + refresh từng điểm"]
  LC --> LOOP
  LOOP -->|Không| GET["get_tour với vi; sort step_order; dựng TourDetail"]
  GET --> T201["201 TourDetail"]
  OP -->|DELETE /api/admin/tours/id| FIND["Tìm tour"]
  FIND --> HAS{"Có tour?"}
  HAS -->|Không| N["404"]
  HAS -->|Có| DEL["Xóa tour + tour_artifacts; commit; giữ nguyên artifacts"]
  DEL --> D204["204 No Content"]
  R201 --> E((Đóng session))
  T201 --> E
  N --> E
  D204 --> E
```

Chưa có PUT tour; chưa có PUT/DELETE room trong router dù repository có hàm tương ứng. Tạo tour commit nhiều lần; artifact_id không tồn tại hoặc trùng trong cùng tour có thể lỗi FK/PK sau khi Tour đã được lưu. Chưa có transaction gộp, validate tồn tại từng điểm hay ánh xạ lỗi này thành response nghiệp vụ.

## 12. Activity A11 — Tìm hiện vật gần nhất theo geofence

```mermaid
flowchart TD
  S((Caller có lat/lng)) --> REQ["GET /api/map/nearby?lat=...&lng=...&lang=..."]
  REQ --> VALID{"lat/lng parse được float?"}
  VALID -->|Không| V["422"]
  VALID -->|Có| LANG["Chuẩn hóa vi/en; mở session"]
  LANG --> BOX["ArtifactRepository.find_nearby: lat/lng khác NULL; bounding box ±0.01 độ"]
  BOX --> LIMIT["Lấy tối đa 50 candidates; eager load translations/room"]
  LIMIT --> INIT["best=None; best_distance=None"]
  INIT --> LOOP{"Còn candidate?"}
  LOOP -->|Có| DIST["Tính Haversine với R=6.371.000 m"]
  DIST --> IN{"distance ≤ geofence_radius hoặc mặc định 10 m?"}
  IN -->|Không| LOOP
  IN -->|Có| BETTER{"Chưa có best hoặc khoảng cách nhỏ hơn best_distance?"}
  BETTER -->|Không| LOOP
  BETTER -->|Có| UPDATE["Cập nhật best và best_distance"]
  UPDATE --> LOOP
  LOOP -->|Không| FOUND{"best khác None?"}
  FOUND -->|Không| NULL["200 JSON null"]
  FOUND -->|Có| TITLE["Chọn title đúng lang; fallback bản đầu; cuối cùng qr_code"]
  TITLE --> RES["200 ArtifactSummary; chưa trả audio URL"]
  RES --> END((Đóng session))
  NULL --> END
  V --> END
```

Chưa có client xin quyền GPS, cập nhật vị trí, gọi detail sau nearby hoặc tự phát audio. API không validate miền lat/lng địa lý, không xét tầng/tường và không có cooldown/hysteresis. Giới hạn 50 ứng viên trước khi tính khoảng cách có thể bỏ sót hiện vật gần nhất trong vùng đông dữ liệu; không bảo đảm gần nhất toàn bộ CSDL.

## 13. Deployment D01 — Cấu hình local suy ra trực tiếp từ source

Đây là topology chạy phát triển được code hướng tới. Các execution environment có thể cùng nằm trên một máy; vị trí máy vật lý thực tế chưa được khai báo. Các lớp router/service/repository **cùng một tiến trình backend**, không phải các microservice riêng.

```mermaid
flowchart TB
  subgraph CLIENT["Thiết bị người dùng / máy phát triển"]
    subgraph BROWSER["Execution environment: Web browser"]
      SPA["React SPA: Home, Lookup, Detail, Map, Tours, Admin"]
      SESSION["sessionStorage: museum_admin_token"]
      MOCK["Dữ liệu mẫu khách + state UI trong JS"]
      SPA --- SESSION
      SPA --- MOCK
    end
  end
  subgraph DEV["Máy phát triển — có thể trùng thiết bị client"]
    VITE["Node.js / Vite :5173 — source JSX + Tailwind; proxy /api"]
    subgraph PY["Python / Uvicorn :8000 — một tiến trình ứng dụng"]
      API["FastAPI main:app; CORS; /api/health"]
      ROUTERS["visitor router + admin router; Pydantic + JWT dependency"]
      SERVICES["AudioService / MapService / AuthService"]
      REPOS["Artifact / PlayLog / Room / Tour / User repositories"]
      ORM["SQLAlchemy + PyMySQL; SessionLocal; pool_pre_ping; recycle 3600 s"]
      CFG[".env + settings: DB, JWT, CORS, TTS_SERVICE_URL, ENV"]
      API --> ROUTERS --> SERVICES --> REPOS --> ORM
      CFG --- API
    end
    MYSQL[("MySQL :3306 mặc định; museum_audio_guide; 7 bảng")]
  end
  MEDIA["Ngoài hệ thống: images.unsplash.com — ảnh giao diện mẫu"]
  TTS["Dự kiến: TTS service; mặc định localhost:8001; implementation chưa có"]
  FILES["Dự kiến: host file thu sẵn; địa chỉ theo audio_url; chưa có cấu hình"]
  SPA -->|"HTTP :5173 — tải module/assets; HMR khi dev"| VITE
  SPA -->|"CMS fetch /api/admin/*; JSON; Bearer cho request bảo vệ"| VITE
  VITE -->|"Proxy /api giữ nguyên path; HTTP localhost:8000"| API
  ORM -->|"MySQL protocol TCP; DB_HOST/DB_PORT"| MYSQL
  SPA -->|"HTTPS tải ảnh mẫu trực tiếp"| MEDIA
  SERVICES -.->|"Chỉ ghép chuỗi URL TTS trong response; không gọi HTTP"| TTS
  SPA -.->|"Tương lai: GET URL audio trực tiếp từ client"| TTS
  SPA -.->|"Tương lai: GET URL file thu sẵn"| FILES
```

MySQL gồm `rooms`, `artifacts`, `artifact_translations`, `tours`, `tour_artifacts`, `play_logs`, `admins`. Nội dung audio và ảnh được tham chiếu bằng URL; không lưu byte media trong DB.

## 14. Deployment D02 — Phương án production đề xuất, chưa có trong source

```mermaid
flowchart TB
  B["Browser khách / quản trị"] -->|HTTPS 443| EDGE["ĐỀ XUẤT: reverse proxy + TLS"]
  EDGE -->|"/ + assets; SPA fallback index.html"| STATIC["ĐỀ XUẤT: static server chứa dist/ từ npm run build"]
  EDGE -->|"/api/* giữ nguyên path"| API["FastAPI / Uvicorn; internal :8000"]
  API -->|"SQLAlchemy / PyMySQL; private network :3306"| DB[("MySQL museum_audio_guide; persistent storage")]
  B -.->|"Chưa nối UI: GET audio URL HTTPS công khai"| AUDIO["ĐỀ XUẤT: media host hoặc TTS qua TLS"]
  AUDIO -.-> TTS["TTS implementation cần bổ sung; port nội bộ tùy cấu hình"]
  AUDIO -.-> MEDIA["Kho file thu sẵn cần bổ sung"]
  SECRET["ĐỀ XUẤT: biến môi trường / secret cho DB, JWT, CORS, public TTS URL"] -.-> API
  BUILD["ĐỀ XUẤT: build frontend + cài backend dependencies; deploy thủ công hoặc pipeline mới"] -.-> STATIC
  BUILD -.-> API
  CHECK["ĐỀ XUẤT: kiểm tra /api/health và kiểm tra DB riêng"] -.-> API
```

`server.proxy` của Vite chỉ có tác dụng dev, không được nhúng vào bundle `dist/`. Vì CMS dùng `/api/admin` tương đối, production phải route đường dẫn này về backend cùng origin hoặc thay code cấu hình API origin. BrowserRouter cần SPA fallback cho truy cập trực tiếp `/admin`, `/ban-do`, `/hien-vat/...`.

`TTS_SERVICE_URL` được đưa ra response để client dùng, nên production cần URL client truy cập được, không dùng tên host chỉ có trong mạng nội bộ. Media/TTS qua HTTPS tránh mixed content khi website chạy HTTPS. Chưa có cơ sở từ source để khẳng định AWS, Azure, Docker, Kubernetes, Nginx, CDN, load balancer hoặc CI/CD đang được sử dụng.

## 15. Activity A12 — Quy trình triển khai và xác minh đề xuất

Luồng này là hướng dẫn triển khai rút ra từ phụ thuộc source, **không phải pipeline sẵn có**.

```mermaid
flowchart TD
  S((Bắt đầu triển khai)) --> GET["Lấy đúng commit; chuẩn bị Node.js, Python, MySQL tương thích"]
  GET --> DB["Tạo DB và 7 bảng theo DB.sql trên database mới"]
  DB --> ENV["Cấu hình DB_*, SECRET_KEY, ALGORITHM, token TTL, CORS_ORIGINS, ENV"]
  ENV --> TTS["Nếu dùng fallback audio: bổ sung TTS server và public TTS_SERVICE_URL"]
  TTS --> DEPS["Backend: tạo venv; pip install -r requirements.txt"]
  DEPS --> ADMIN["Từ backend-thuyet-minh: python create_admin.py với thông tin tài khoản được chọn"]
  ADMIN --> API["Chạy uvicorn main:app --port 8000; host bind tùy môi trường"]
  API --> HEALTH["GET /api/health"]
  HEALTH --> H{"status ok?"}
  H -->|Không| FIX["Kiểm tra tiến trình, cấu hình, dependency và log; sửa rồi chạy lại"]
  FIX --> API
  H -->|Có| REAL["Đăng nhập và gọi /api/admin/me để xác minh đường DB/JWT"]
  REAL --> DBOK{"Đọc/ghi DB và xác thực thành công?"}
  DBOK -->|Không| FIX
  DBOK -->|Có| MODE{"Môi trường"}
  MODE -->|Local dev| DEV["Frontend: npm ci; npm run dev; Vite :5173 proxy API :8000"]
  MODE -->|Production đề xuất| BUILD["npm ci; npm run build → dist/"]
  BUILD --> HOST["Cấu hình static hosting, TLS, /api proxy, SPA fallback và network DB"]
  DEV --> TEST["Kiểm tra CMS login/me/stats/logout; visitor API kiểm tra riêng bằng HTTP client"]
  HOST --> TEST
  TEST --> OK{"Kết quả đúng và nhánh lỗi phù hợp?"}
  OK -->|Không| REPAIR["Sửa cấu hình/implementation; build hoặc restart phần thay đổi"]
  REPAIR --> MODE
  OK -->|Có| LIMIT["Ghi nhận visitor UI còn mock; TTS/media/mobile chỉ sẵn sàng nếu đã bổ sung"]
  LIMIT --> E((Hoàn tất kiểm tra triển khai))
```

`/api/health` hiện chỉ trả `status` và `env`, không truy vấn DB/TTS; response OK chưa đủ kết luận toàn hệ thống hoạt động. `DB.sql` dùng `CREATE TABLE` không có `IF NOT EXISTS`, không phải migration có thể chạy lặp tùy ý. `create_admin.py` nằm trực tiếp trong thư mục backend; comment `python -m scripts.create_admin` trong file không khớp cây thư mục hiện tại.

## 16. Danh mục endpoint đối chiếu

Mọi đường dẫn sau có prefix `/api`. Ngoại trừ login, endpoint `/admin/*` đều dùng `get_current_user`.

| Method | Path | Dữ liệu / xử lý | Response nghiệp vụ chính |
|---|---|---|---|
| GET | `/health` | Không DB | 200 status/env |
| GET | `/artifacts` | q, lang, skip=0, limit=20 | 200 list |
| GET | `/artifacts/lookup/{qr_code}` | QR + lang | 200 / 404 |
| GET | `/artifacts/{artifact_id}` | ID + lang | 200 / 404 |
| POST | `/play-logs` | PlayLogCreate | 201 / 404 |
| GET | `/rooms` | Tất cả phòng theo code | 200 |
| GET | `/rooms/{room_id}` | Phòng + hiện vật | 200 / 404 |
| GET | `/map/nearby` | lat, lng, lang | 200 summary hoặc null |
| GET | `/tours` | lang | 200 |
| GET | `/tours/{tour_id}` | lang | 200 / 404 |
| POST | `/admin/login` | username, password | 200 JWT / 401 |
| GET | `/admin/me` | Bearer token | 200 / 401 |
| POST | `/admin/artifacts` | ArtifactCreate | 201 / 409 |
| PUT | `/admin/artifacts/{artifact_id}` | ArtifactUpdate | 200 / 404 |
| DELETE | `/admin/artifacts/{artifact_id}` | ID | 204 / 404 |
| POST | `/admin/rooms` | RoomCreate | 201 |
| POST | `/admin/tours` | TourCreate | 201 |
| DELETE | `/admin/tours/{tour_id}` | ID | 204 / 404 |
| GET | `/admin/stats/top-played` | lang=vi, limit=10 | 200 |

API có schema/query parameter sai kiểu có thể trả 422; API bảo vệ có thể trả 401 trước xử lý nghiệp vụ. Lỗi không được bắt, lỗi DB hoặc lỗi response validation có thể thành 500; bảng trên không khẳng định mọi lỗi đều được xử lý hoàn chỉnh.

## 17. Nguồn đối chiếu theo commit

Các nhận xét được rút từ implementation, ưu tiên code thực thi hơn README/comment cũ.

- [Frontend routes](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/src/App.jsx), [Lookup](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/src/pages/ArtifactLookup.jsx), [Detail](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/src/pages/ArtifactDetail.jsx).
- [Map UI](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/src/pages/MuseumMap.jsx), [Tours UI](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/src/pages/ToursCollections.jsx), [CMS UI](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/src/pages/admin/AdminDashboard.jsx).
- [Visitor endpoints](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/api/routers/visitor.py), [Admin endpoints](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/api/routers/admin.py), [JWT dependencies](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/api/dependencies.py).
- [Audio service](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/services/audio_service.py), [Map service](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/services/map_service.py), [Auth service](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/services/auth_service.py).
- [DB DDL](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/DB.sql), [Vite proxy](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/vite.config.js), [Backend entry](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/main.py), [Settings](https://github.com/Chauthienhao/Seminar/blob/8c484cdf93f529af73ff7737e84cb35d825c215c/backend-thuyet-minh/core/config.py).
