module.exports.register = (req, res, next) => {
    const { name, email, phone, password, confirmPassword } = req.body;
    console.log(req.body)
    const errors = [];


    if (!name || name.trim().length === 0) {
        errors.push("Tên không được để trống");
    } else if (name.length < 2 || name.length > 50) {
        errors.push("Tên phải có độ dài từ 2-50 ký tự");
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim().length === 0) {
        errors.push("Email không được để trống");
    } else if (!emailRegex.test(email)) {
        errors.push("Email không hợp lệ");
    }


    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phone || phone.trim().length === 0) {
        errors.push("Số điện thoại không được để trống");
    } else if (!phoneRegex.test(phone)) {
        errors.push("Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam)");
    }


    if (!password || password.trim().length === 0) {
        errors.push("Mật khẩu không được để trống");
    } else if (password.length < 6) {
        errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    } else if (!/[A-Z]/.test(password)) {
        errors.push("Mật khẩu phải chứa ít nhất 1 chữ hoa");
    } else if (!/[0-9]/.test(password)) {
        errors.push("Mật khẩu phải chứa ít nhất 1 số");
    }

    if (!confirmPassword || confirmPassword.trim().length === 0) {
        errors.push("Xác nhận mật khẩu không được để trống");
    } else if (confirmPassword !== password) {
        errors.push("Xác nhận mật khẩu không khớp");
    }

    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0],
            errors: errors
        });
    }

   
    next();
};


module.exports.login = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    // Kiểm tra email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim().length === 0) {
        errors.push("Email không được để trống");
    } else if (!emailRegex.test(email)) {
        errors.push("Email không hợp lệ");
    }

    // Kiểm tra mật khẩu
    if (!password || password.trim().length === 0) {
        errors.push("Mật khẩu không được để trống");
    }

    // Nếu có lỗi, trả về phản hồi lỗi
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0],
            errors: errors
        });
    }

    // Nếu không có lỗi, tiếp tục
    next();
};

module.exports.checkFormProfile = (req, res, next) => {
    const { name, email, phoneNumber, dateOfBirth, address } = req.body;
    const errors = [];
    // Kiểm tra tên
    if (!name || name.trim().length === 0) {
        errors.push("Tên không được để trống");
    } else if (name.length < 2 || name.length > 50) {
        errors.push("Tên phải có độ dài từ 2-50 ký tự");
    }

    // Kiểm tra email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim().length === 0) {
        errors.push("Email không được để trống");
    } else if (!emailRegex.test(email)) {
        errors.push("Email không hợp lệ");
    }

    // Kiểm tra số điện thoại
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneNumber || phoneNumber.trim().length === 0) {
        errors.push("Số điện thoại không được để trống");
    } else if (!phoneRegex.test(phoneNumber)) {
        errors.push("Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam)");
    }

    // Kiểm tra ngày sinh
    if (!dateOfBirth || dateOfBirth.trim().length === 0) {
        errors.push("Ngày sinh không được để trống");
    }

    // Kiểm tra địa chỉ
    if (!address || address.trim().length === 0) {
        errors.push("Địa chỉ không được để trống");
    }

    // Nếu có lỗi, trả về phản hồi lỗi
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0],
            errors: errors
        });
    }

    // Nếu không có lỗi, tiếp tục
    next();
};