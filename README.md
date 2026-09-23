# IoT-Lab — Flood Monitoring Dashboard (Vite PWA)

Hệ thống giám sát ngập lụt và cảnh báo lũ gồm 4 trạm ESP32 cố định kết nối qua Supabase REST API, hỗ trợ điều khiển Emergency tức thời, giám sát nhịp tim Heartbeat, biểu đồ mực nước và cơ chế PWA cài đặt trực tiếp trên thiết bị di động (iOS / Android).

Project được refactor trực tiếp từ source chuẩn `legacy/IoT_Lab_Dashboard_V7_Emergency_Fast.html` theo kiến trúc ES Modules, Vite và PWA.

---

## 1. Kiến trúc hệ thống (Architecture)

```text
ESP32 Stations (S1, S2, S3, S4)
            │  (GPIO32 Emergency / FreeRTOS / Telemetry)
            ▼
   Supabase PostgreSQL & REST API
   (sensor_readings, stations, device_commands, alert_thresholds)
            ▲
            │  (HTTPS REST Polling 1s / Publishable Anon Key)
            ▼
      Vite PWA Frontend
   (Vanilla ES Modules + Service Worker + Manifest)
            │
            ▼
      GitHub → Vercel
```

---

## 2. 4 Trạm giám sát (Stations)

- **S1**: Drainage Zone (`station_id = 1`)
- **S2**: Green Retention Zone (`station_id = 2`)
- **S3**: Residential Zone (`station_id = 3`)
- **S4**: Urban Industrial Zone (`station_id = 4`)

### Cơ chế Heartbeat & Trạng thái kết nối
- Dữ liệu `stations.last_seen` là **Source of Truth** duy nhất.
- `ageSeconds <= 25s`: **ONLINE** (xanh lá nhấp nháy).
- `25s < ageSeconds <= 30s`: **UNSTABLE** (vàng cam).
- `ageSeconds > 30s` hoặc không có dữ liệu: **OFFLINE** (đỏ nhấp nháy; làm mờ các chỉ báo dữ liệu cũ để tránh hiểu nhầm).

### Cơ chế Emergency & Reset
- **Station Emergency**: Nhấn 1 lần gửi ngay lệnh `EMERGENCY ON` đến trạm tương ứng. Giữ trạng thái đỏ (Persistent Red) cho tới khi Reset.
- **Station Reset**: Chỉ reset duy nhất trạm được chọn bằng lệnh `EMERGENCY OFF`.
- **Master Emergency (All Stations)**: Cơ chế giữ nút 2 giây (`HOLD 2s`), xác nhận qua hộp thoại và gửi đồng loạt `EMERGENCY ON` đến cả 4 trạm.
- **ACK Semantics**: Khi dashboard ghi thành công vào bảng `device_commands`, giao diện hiển thị trạng thái `✓ sent — waiting for ESP32`, tuyệt đối không tự ý đánh dấu đã thực thi khi ESP32 chưa phản hồi.

---

## 3. Cài đặt và Chạy Development

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server development (Port 3000)
npm run dev
```

Truy cập: `http://localhost:3000`

---

## 4. Production Build & Test

```bash
# Build production bundle
npm run build

# Preview bản build production
npm run preview
```

Thư mục đầu ra: `dist/`

---

## 5. Cấu hình biến môi trường (Environment Variables)

File mẫu: `.env.example`

| Tên biến | Bắt buộc | Mô tả |
|---|---|---|
| `VITE_SUPABASE_URL` | Có | URL dự án Supabase (VD: `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Không | Supabase Publishable / Anon Key (Có thể nhập trực tiếp trong menu Settings trên giao diện) |

> ⚠️ **Bảo mật**: Chỉ sử dụng `anon` key public. Tuyệt đối **KHÔNG** đưa `service_role` key vào code frontend hoặc GitHub.

---

## 6. Hướng dẫn Deploy lên Vercel từ GitHub

1. **Đưa mã nguồn lên GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: migrate IoT Lab Dashboard V7 to Vite PWA"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-name>.git
   git push -u origin main
   ```

2. **Import vào Vercel**:
   - Truy cập [vercel.com](https://vercel.com) và đăng nhập.
   - Chọn **Add New Project** → **Import Git Repository**.
   - Chọn repository bạn vừa push.

3. **Thiết lập cấu hình build trên Vercel**:
   - **Framework Preset**: `Vite` (Vercel tự động nhận diện).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Khai báo Environment Variables trên Vercel**:
   - `VITE_SUPABASE_URL`: `https://srnghkvozbjuufpumaqf.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-publishable-anon-key>`

5. **Nhấn Deploy**: Ứng dụng sẽ tự động được build và cung cấp domain HTTPS miễn phí.

---

## 7. Tính năng PWA (Progressive Web App)

- Hoạt động mượt mà trên Mobile (iOS Safari & Android Chrome), Tablet và Desktop.
- Hỗ trợ cài đặt vào Màn hình chính (Add to Home Screen) qua nút `📥 Cài đặt PWA` trên giao diện.
- Service Worker precache tài nguyên tĩnh (HTML, CSS, JS, icon), **không cache dữ liệu IoT động** để đảm bảo dữ liệu viễn thám luôn theo thời gian thực 100%.
- Tự động hiển thị thanh thông báo khi mất kết nối Internet.

---

## 8. Cấu trúc thư mục

```text
├── index.html                           # Giao diện chính đồng bộ V7
├── package.json                         # Quản lý scripts và dependencies
├── vite.config.ts                       # Cấu hình Vite & vite-plugin-pwa
├── README.md                            # Hướng dẫn chi tiết
├── .gitignore                           # Bảo vệ env và node_modules
├── .env.example                         # Biến môi trường mẫu
│
├── public/
│   ├── manifest.webmanifest             # Web App Manifest tiêu chuẩn
│   ├── icon.svg                         # Vector icon ứng dụng
│   ├── pwa-192x192.png                  # Icon chuẩn PWA 192px
│   ├── pwa-512x512.png                  # Icon chuẩn PWA 512px
│   ├── pwa-maskable-512x512.png         # Icon Android maskable 512px
│   ├── apple-touch-icon.png             # Icon iOS Safari 180px
│   └── favicon.ico                      # Desktop browser icon
│
├── legacy/
│   └── IoT_Lab_Dashboard_V7_Emergency_Fast.html # Source gốc V7 nguyên vẹn
│
└── src/
    ├── main.js                          # Điểm khởi chạy app & đăng ký SW
    ├── app.js                           # Điều phối polling 1s và các modal
    ├── styles.css                       # Toàn bộ CSS V7, animations, responsive
    │
    ├── services/
    │   └── supabase.js                  # Dịch vụ gọi REST API Supabase
    │
    ├── modules/
    │   ├── stations.js                  # Quản lý và render 4 station
    │   ├── emergency.js                 # Emergency 1-click, Reset, Master Hold 2s
    │   ├── thresholds.js                # Quản lý ngưỡng cảnh báo & lưu Supabase
    │   ├── connection.js                # Phân tích last_seen, nhịp tim heartbeat
    │   ├── records.js                   # Bảng 20 bản ghi cảm biến mới nhất
    │   └── chart.js                     # Biểu đồ Canvas lịch sử mực nước
    │
    └── components/
        ├── station-card.js              # Template card station chuẩn V7
        ├── settings-modal.js            # Hộp thoại cấu hình Supabase URL & Key
        ├── status-modal.js              # Hộp thoại giải thích LED & Master Emergency
        ├── threshold-modal.js           # Hộp thoại hiệu chỉnh ngưỡng cảnh báo
        └── pwa-install.js               # Nút cài đặt PWA & thông báo offline
```
