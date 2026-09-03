# Frontend ERP - cấu trúc module

`index.html` chỉ là điểm vào. `JS/bootstrap.js` nạp giao diện trước, sau đó nạp script theo thứ tự phụ thuộc.

## Giao diện


## JavaScript

- `JS/core/app-core.js`: dữ liệu dùng chung, điều hướng, format và render tổng
- `JS/modules/`: nghiệp vụ theo chức năng
- `JS/api/`: API, xác thực/phân quyền, danh bạ và tài khoản

Hai bản trước khi tách được giữ tại `legacy/` chỉ để đối chiếu. Không được nạp khi chạy ứng dụng.
