FROM node:24-alpine

WORKDIR /app

COPY Backend/package.json Backend/package-lock.json ./Backend/
RUN npm --prefix Backend ci --omit=dev

COPY Backend ./Backend
COPY Frontend ./Frontend

ENV NODE_ENV=production
EXPOSE 4000

# Chuyển hướng vào thư mục Backend để npm đọc được package.json
WORKDIR /app/Backend

# Lệnh khởi chạy tuần tự: Cập nhật cấu trúc DB -> Tạo tài khoản Admin -> Bật server
CMD ["sh", "-c", "npm run migrate && BOOTSTRAP_ADMIN_USERNAME=admin BOOTSTRAP_ADMIN_PASSWORD=185cmT8@12345678 node scripts/bootstrap-admin.js && npm start"]
