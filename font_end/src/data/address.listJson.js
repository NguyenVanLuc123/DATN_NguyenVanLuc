const addressData = [
    {
      "city": "Thành phố Hà Nội",
      "districts": [
        {
          "district": "Quận Ba Đình",
          "wards": [
            "Phường Phúc Xá",
            "Phường Trúc Bạch",
            "Phường Vĩnh Phúc",
            "Phường Công Vị",
            "Phường Liễu Giải",
            "Phường Nguyễn Trung Trực",
            "Phường Quân Thánh",
            "Phường Ngọc Hà",
            "Phường Điện Biên",
            "Phường Đội Cần",
            "Phường Ngọc Khánh",
            "Phường Kim Mã",
            "Phường Giảng Võ",
            "Phường Thành Công"
          ]
        },
        {
          "district": "Quận Hoàn Kiếm",
          "wards": [
            "Phường Phúc Tân",
            "Phường Đồng Xuân",
            "Phường Hàng Mã",
            "Phường Hàng Buồm",
            "Phường Hàng Đào",
            "Phường Hàng Bồ",
            "Phường Cửa Đông",
            "Phường Lý Thái Tổ",
            "Phường Hàng Bạc",
            "Phường Hàng Gai",
            "Phường Chương Dương",
            "Phường Hàng Trống",
            "Phường Cửa Nam",
            "Phường Hàng Bóng",
            "Phường Tràng Tiền",
            "Phường Trần Hưng Đạo",
            "Phường Phan Chu Trinh",
            "Phường Hàng Bài"
          ]
        },
        {
          "district": "Quận Tây Hồ",
          "wards": [
            "Phường Phú Thượng",
            "Phường Nhật Tân",
            "Phường Tứ Liên",
            "Phường Quảng An",
            "Phường Xuân La",
            "Phường Yên Phụ",
            "Phường Bưởi",
            "Phường Thụy Khuê"
          ]
        },
        {
          "district": "Quận Long Biên",
          "wards": [
            "Phường Thượng Thanh",
            "Phường Ngọc Thụy",
            "Phường Giang Biên",
            "Phường Đức Giang",
            "Phường Việt Hưng",
            "Phường Gia Thuỷ",
            "Phường Ngọc Lâm",
            "Phường Phúc Lợi",
            "Phường Bộ Đề",
            "Phường Sài Đồng",
            "Phường Long Biên",
            "Phường Thạch Bản",
            "Phường Phúc Đông",
            "Phường Cự Khối"
          ]
        },
        {
          "district": "Quận Cầu Giấy",
          "wards": [
            "Phường Nghĩa Đô",
            "Phường Nghĩa Tân",
            "Phường Mai Dịch",
            "Phường Dịch Vọng",
            "Phường Dịch Vọng Hậu",
            "Phường Quan Hoa",
            "Phường Yên Hoa",
            "Phường Trung Hoà"
          ]
        },
        {
          "district": "Quận Đông Đa",
          "wards": [
            "Phường Cát Linh",
            "Phường Văn Miếu",
            "Phường Quốc Tứ Giám",
            "Phường Láng Thượng",
            "Phường Ô Chợ Dữa",
            "Phường Văn Chương",
            "Phường Hàng Bột",
            "Phường Láng Hạ",
            "Phường Khâm Thiên",
            "Phường Thổ Quan",
            "Phường Nam Đồng",
            "Phường Trung Phụng",
            "Phường Quang Trung",
            "Phường Trung Liệt",
            "Phường Phương Liên",
            "Phường Thịnh Quang",
            "Phường Trung Tự",
            "Phường Kim Liên",
            "Phường Phương Mai",
            "Phường Ngã Tư Sở",
            "Phường Khương Thượng"
          ]
        },
        {
          "district": "Quận Hai Bà Trưng",
          "wards": [
            "Phường Nguyễn Du",
            "Phường Bạch Đằng",
            "Phường Phạm Đình Hồ",
            "Phường Lê Đại Hành",
            "Phường Đồng Nhân",
            "Phường Phố Huế",
            "Phường Đồng Mác",
            "Phường Thanh Lương",
            "Phường Thanh Nhân",
            "Phường Cầu Dền",
            "Phường Bách Khoa",
            "Phường Đông Tâm",
            "Phường Vĩnh Tuy",
            "Phường Bạch Mai",
            "Phường Quỳnh Mai",
            "Phường Quỳnh Lôi",
            "Phường Minh Khai",
            "Phường Trương Định"
          ]
        },
        {
          "district": "Quận Hoàng Mai",
          "wards": [
            "Phường Thanh Trì",
            "Phường Vĩnh Hưng",
            "Phường Đinh Công",
            "Phường Mai Đông",
            "Phường Tương Mai",
            "Phường Đại Kim",
            "Phường Tân Mai",
            "Phường Hoàng Văn Thu",
            "Phường Giáp Bát",
            "Phường Linh Nam",
            "Phường Thịnh Liệt",
            "Phường Trần Phú",
            "Phường Hoàng Liệt",
            "Phường Yên Sở"
          ]
        },
        {
          "district": "Quận Thanh Xuân",
          "wards": [
            "Phường Nhân Chính",
            "Phường Thượng Đình",
            "Phường Khương Trung",
            "Phường Khương Mai",
            "Phường Thanh Xuân Trung",
            "Phường Phương Liệt",
            "Phường Hạ Đình",
            "Phường Khương Đình",
            "Phường Thanh Xuân Bắc",
            "Phường Thanh Xuân Nam",
            "Phường Kim Giang"
          ]
        },
        {
          "district": "Huyện Sóc Sơn",
          "wards": [
            "Thị trấn Sóc Sơn",
            "Xã Bắc Sơn",
            "Xã Minh Trí",
            "Xã Hồng Kỳ",
            "Xã Nam Sơn",
            "Xã Trung Giá",
            "Xã Tân Hưng",
            "Xã Minh Phú",
            "Xã Phú Linh",
            "Xã Bắc Phú",
            "Xã Tân Minh",
            "Xã Quang Tiến",
            "Xã Hiền Ninh",
            "Xã Tân Dân",
            "Xã Tiến Dược",
            "Xã Việt Long",
            "Xã Xuân Giang",
            "Xã Mai Đình",
            "Xã Đức Hoà",
            "Xã Thanh Xuân",
            "Xã Đông Xuân",
            "Xã Kim Lũ",
            "Xã Phú Cường",
            "Xã Phú Minh",
            "Xã Phú Lỗ",
            "Xã Xuân Thu"
          ]
        }
      ]
    },
    {
      "city": "Tỉnh Hà Giang",
      "districts": [
        {
          "district": "Thành phố Hà Giang",
          "wards": [
            "Phường Nguyễn Trãi",
            "Phường Trần Phú",
            "Phường Ngọc Hà",
            "Phường Quang Trung",
            "Phường Ngọc Đường",
            "Xã Phương Độ",
            "Xã Phương Thiện"
          ]
        },
        {
          "district": "Huyện Đồng Văn",
          "wards": [
            "Thị trấn Phó Bảng",
            "Xã Lũng Cú",
            "Xã Má Lé",
            "Thị trấn Đồng Văn",
            "Xã Lũng Tảo",
            "Xã Phố Là",
            "Xã Thái Phìn Tùng",
            "Xã Sùng Là",
            "Xã Xà Phìn",
            "Xã Tà Phìn",
            "Xã Tà Lũng",
            "Xã Phố Cáo",
            "Xã Sinh Lùng",
            "Xã Sáng Tùng",
            "Xã Lũng Thầu",
            "Xã Hồ Quảng Phìn",
            "Xã Vân Chải",
            "Xã Lũng Phìn",
            "Xã Sùng Trái"
          ]
        }
      ]
    }
  ]
  export default addressData;