# Chạy bộ phân giải BMAD trên máy hiện tại

Đã xác minh ngày 2026-09-29: Python 3.12.14 có sẵn trong runtime; lỗi trước đó là không tìm thấy interpreter qua PATH/py launcher. Không cần cài lại Python hoặc thay PATH để chạy các bộ phân giải dùng thư viện chuẩn.

Từ thư mục gốc dự án, dùng PowerShell:

```powershell
& 'C:/Users/tranv/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' --version
& 'C:/Users/tranv/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' _bmad/scripts/resolve_customization.py --skill .agents/skills/gds-gdd --project-root . --key workflow
& 'C:/Users/tranv/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' _bmad/scripts/resolve_config.py --project-root .
```

Cả hai bộ phân giải trả mã thoát 0. Các bước workflow GDD còn lại là hướng dẫn trong `.agents/skills/gds-gdd/SKILL.md`, không phải một chương trình tự chạy toàn bộ bằng lệnh trên.

Đường dẫn là riêng cho máy hiện tại và có thể đổi khi runtime được cập nhật. `python`, `py` và `uv` chưa được sửa trên PATH; hướng dẫn này giải quyết cách chạy BMAD trong dự án hiện tại. Không áp dụng thay `uv run` bằng Python trực tiếp cho script khác có dependency chưa được kiểm tra.
