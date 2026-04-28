# OTP Rental Tool

Web app/PWA riêng để thuê số GrizzlySMS và chờ OTP trên iPhone.

## Tính năng

- Chọn quốc gia: UK, Indonesia, Thailand, Canada
- Dịch vụ mặc định: TikTok (`tt`)
- Không cần đăng nhập
- Mỗi iPhone dùng một `token` riêng
- API key GrizzlySMS nằm trên server, không lộ ra iPhone
- Tự polling OTP mỗi 5 giây
- Quá 60 giây chưa có OTP thì có thể hủy/lấy số mới

## Cài đặt local

```bash
npm install
cp .env.example .env
npm start
```

Sửa `.env`:

```env
GRIZZLY_API_KEY=api_key_that_cua_ban
APP_TOKENS=iphone1,iphone2,iphone3
PORT=3000
```

Mở:

```txt
http://localhost:3000/?token=iphone1
```

## Deploy

Có thể deploy lên Render, Railway, VPS, hoặc bất kỳ host Node.js nào.

Sau khi deploy, iPhone mở link:

```txt
https://domain-cua-ban.com/?token=iphone1
```

Rồi Safari → Share → Add to Home Screen.

## Lưu ý

Không commit file `.env` lên GitHub. Chỉ commit `.env.example`.
