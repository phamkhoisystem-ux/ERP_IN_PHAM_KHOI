# ERP Phạm Khôi API

## Khởi chạy

1. Import `database-v2.sql`, sau đó chạy lần lượt các migration trong `database/migrations` theo thứ tự số (mỗi file đúng một lần, hiện đến `008_directory_birthdays.sql`).
2. Sao chép `.env.example` thành `.env`, điền thông tin MySQL và thay `JWT_SECRET` bằng chuỗi ngẫu nhiên tối thiểu 32 ký tự.
3. Chạy `npm install`, `npm run bootstrap:admin`, rồi `npm run dev`.

Node phục vụ cả frontend và API. Sau `npm run dev`, mở **http://localhost:4000/** (không mở `index.html` bằng file://). API ở `http://localhost:4000/api`; frontend đã có `Frontend/JS/api.js` dùng API này cho đăng nhập và quản trị tài khoản.

## Model nghiệp vụ

`User` (tài khoản, role, employee_id), `Employee`, `Customer`, `Supplier`, `MaterialItem`, `MaterialTransaction`, `FinishedProduct`, `ProductionPlan`, `ProductionPlanDetail`, `ProductionOrder`, `ProductionOrderMaterial`, `SupplierDebt`, `SupplierPayment`, `WalletTransaction`, `Sale`, `Asset`, `Loan`, `LoanSchedule`, `SalaryPayment`, `HistoryLog`.

## Phân quyền

ADMIN cấp hoặc khóa tài khoản qua `POST/PATCH /api/users`. Khi cấp tài khoản, ADMIN chọn một hoặc nhiều module; backend kiểm tra module ở mọi request. Role là mẫu quyền dự phòng cho các tài khoản cũ chưa chọn module.

| Role | Phạm vi chính |
|---|---|
| ADMIN | Toàn quyền, cấp tài khoản và xem nhật ký |
| SALE | Khách hàng, thành phẩm, bán hàng |
| DESIGNER | Kế hoạch/lệnh sản xuất |
| WORKER | Xem và cập nhật trạng thái lệnh, nhật ký sản xuất |
| THUQUY | Sổ quỹ, thanh toán công nợ |
| ACCOUNTANT | Tài chính, công nợ, lương, tài sản, khoản vay, báo cáo |
| OTHER | Không có quyền nghiệp vụ mặc định |

Các route đã có: `/auth/login`, `/auth/me`, `/users`, `/catalog/:entity`, `/resources/:resource`, `/operations/production-orders`, `/operations/material-transactions`, `/operations/wallet-transactions`, `/operations/history`.

`/resources/:resource` hỗ trợ `GET`, `GET /:id`, `POST`, `PATCH /:id` cho: employees, productionPlans, productionPlanDetails, productionOrders, productionOrderMaterials, supplierDebts, supplierPayments, walletTransactions, sales, assets, loans, loanSchedules, salaryPayments và historyLogs (chỉ đọc). Mọi yêu cầu phải có Bearer token.

`PUT /api/state` và `GET /api/state` lưu/tải trạng thái hiện tại của các form legacy vào bảng `app_states` trong MySQL. Frontend gọi endpoint này qua `syncDB()`, nên không còn ghi lên Google Sheets.

Quản trị viên có thể sao lưu, khôi phục và hoàn tác lần khôi phục gần nhất qua `/api/state/backup`, `/api/state/restore`, `/api/state/undo`. Trước khi khôi phục, cần chạy migration `005_app_state_backups.sql` để có điểm hoàn tác trong MySQL.
