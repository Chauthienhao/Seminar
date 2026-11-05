"""
Tạo MỚI hoặc CẬP NHẬT mật khẩu cho 1 tài khoản quản trị CMS — tự động băm mật khẩu
đúng chuẩn bcrypt, bạn không cần tự tay tạo hash.

Dùng khi nào:
  - Chưa có tài khoản admin nào (mới cài đặt lần đầu).
  - Đã chạy seed_data.sql và tài khoản 'admin' đang có password_hash giả
    'REPLACE_WITH_REAL_BCRYPT_HASH' (chạy script này để GHI ĐÈ bằng hash thật).
  - Quên mật khẩu / muốn đổi mật khẩu một tài khoản đã có.

Chạy SAU khi đã chạy DB.sql — nếu chưa có bảng, script sẽ tự tạo bảng theo entities.py
(thiếu các cột bản đồ), khiến DB.sql báo lỗi bảng đã tồn tại.

Cách chạy (trong thư mục backend-thuyet-minh, đã kích hoạt venv nếu có):
  python create_admin.py
  python create_admin.py --username admin --password "MatKhauMoi123"
"""
import argparse
import uuid

from core.database import Base, SessionLocal, engine
from core.security import hash_password
from domain.entities import User


def main():
    parser = argparse.ArgumentParser(description="Tạo hoặc cập nhật tài khoản quản trị CMS")
    parser.add_argument("--username", default="admin", help="Tên đăng nhập (mặc định: admin)")
    parser.add_argument("--password", default="Admin@123", help="Mật khẩu (mặc định: Admin@123)")
    parser.add_argument("--full-name", default="Quản trị viên", help="Họ tên hiển thị")
    parser.add_argument("--role", default="SUPER_ADMIN", choices=["SUPER_ADMIN", "STAFF"])
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)  # đảm bảo các bảng đã tồn tại, kể cả admins
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == args.username).first()

        if user:
            user.password_hash = hash_password(args.password)
            user.full_name = args.full_name
            user.role = args.role
            db.commit()
            print(f"Đã CẬP NHẬT mật khẩu cho tài khoản đã có: '{args.username}'.")
        else:
            user = User(
                id=str(uuid.uuid4()),
                username=args.username,
                password_hash=hash_password(args.password),
                full_name=args.full_name,
                role=args.role,
            )
            db.add(user)
            db.commit()
            print(f"Đã TẠO MỚI tài khoản: '{args.username}'.")

        print()
        print("Đăng nhập thử:")
        print(f"  username: {args.username}")
        print(f"  password: {args.password}")
        print(f"  POST http://localhost:8000/api/admin/login")
    finally:
        db.close()


if __name__ == "__main__":
    main()
