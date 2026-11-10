# Hướng giao diện MidTermCP Admin

## Design Read

Đọc app này như một công cụ quản lý hồ sơ user cho admin trên web và điện thoại: sáng, gọn, ưu tiên tra cứu nhanh; ENERGY 2 / RHYTHM 2 / MOTION 1.

## Quyết định thiết kế

- **Màu:** nền trắng ngà giảm chói khi đọc danh sách; xanh lá thông làm màu thao tác chính để nhận diện hành động quản lý; xanh ngọc dịu làm bề mặt phụ; hổ phách chỉ nhấn số lượng hồ sơ có thật.
- **Bố cục:** màn hình bắt đầu bằng tiêu đề và hành động thêm, tiếp theo là tìm kiếm và danh sách; đây là thứ tự công việc admin thực hiện và không dành chỗ cho số liệu hoặc phần giới thiệu giả.
- **Web và mobile:** web dùng hàng dữ liệu có cột tên/email/thao tác; điện thoại chuyển thành hàng hồ sơ một cột để tên và email không bị ép ngang.
- **Chữ:** dùng font hệ thống để tiếng Việt rõ, tôn trọng cỡ chữ hệ điều hành và không cần tải font ngoài.
- **Khoảng cách:** nhịp 8/16/24 px giúp phân biệt trường trong form, hàng trong danh sách và các khu vực lớn.
- **Bề mặt:** dùng đường viền và tương phản nền thay cho bóng đổ để bảng dữ liệu dễ quét, không tạo cảm giác các hàng là thẻ quảng cáo.
- **Ảnh:** dùng ảnh đại diện do admin chọn; khi chưa có ảnh, dùng chữ cái đầu lấy từ tên thật, không tạo ảnh người dùng giả.
- **Chuyển động:** chỉ phản hồi nhấn và trạng thái tải; danh sách/form không chạy hiệu ứng trang trí để giữ thao tác nhanh.
- **Biểu tượng:** ưu tiên nhãn chữ đi cùng thao tác; nếu có ký hiệu, dùng biểu tượng hệ thống đúng nghĩa cho tìm kiếm, sửa, xóa hoặc đóng.
