// controllers/customer.controller.js
const database = require('../../../Config/DataBase');
const crypto = require('crypto');
module.exports.getprofile = async (req, res) => {
  try {
    // req.user chứa toàn bộ thông tin customer (AuthCustomer đã gán)
    return res.status(200).json({
      success: true,
      message: 'Lấy profile thành công',
      data: req.user
    });
  } catch (error) {
    console.error('Lỗi getprofile:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy profile'
    });
  }
};

module.exports.postprofile = async (req, res) => {
  try {
    // 1) Lấy ID customer
    const userId = req.user.id;

    // 2) Lấy các trường text, mặc định '' nếu không có
    const {
      name = '',
      email = '',
      address = '',
      phoneNumber = '',
      dateOfBirth = '',
      nationalId = ''
    } = req.body;

    // 3) Lấy URL file đã upload (nếu có) từ req.body
    let img = '';
    let drivingLicense = '';
    if (req.body.img) {
      img = req.body.img
    }// Lấy URL từ req.body hoặc để trống
    if (req.body.drivingLicense) {
      drivingLicense = req.body.drivingLicense
    } // Lấy URL từ req.body hoặc để trống

    // 4) Nếu img hoặc drivingLicense không có trong req.body, lấy từ DB
    let userData = [];
    if (req.user.is_owner === 0) {
      userData = await database.connectDatabase("SELECT img, driving_license FROM customer WHERE id = ?", [userId]);
    }
    else {
      userData = await database.connectDatabase("SELECT img, driving_license FROM owner WHERE id = ?", [userId]);
    }

    if (userData.length > 0) {
      if (!img) {
        img = userData[0].img; // Lấy từ DB nếu không có trong req.body
      }
      if (!drivingLicense) {
        drivingLicense = userData[0].driving_license; // Lấy từ DB nếu không có trong req.body
      }
    }

    let tableName = '';
    if (req.user.is_owner == 0) {
      tableName = "customer";
    }
    else {
      tableName = "owner";
    }
    // 5) Chuẩn bị câu lệnh UPDATE
    const sql = `
      UPDATE ${tableName}
      SET
        img            = ?,
        name           = ?,
        date_of_birth  = ?,
        phone_number   = ?,
        email          = ?,
        national_id    = ?,
        driving_license = ?,
        address        = ?
      WHERE id = ?
    `;

    const params = [
      img,
      name,
      dateOfBirth,
      phoneNumber,
      email,
      nationalId,
      drivingLicense,
      address,
      userId
    ];

    // 6) Thực thi cập nhật
    const result = await database.connectDatabase(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user để cập nhật'
      });
    }

    // 7) Trả về thành công
    return res.status(200).json({
      success: true,
      message: 'Cập nhật profile thành công'
    });
  } catch (error) {
    console.error('Lỗi postprofile:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật profile'
    });
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const id = req.user.user_id
    const { newPassword } = req.body;
    const errors = [];
    if (!newPassword || newPassword.trim().length === 0) {
      errors.push("Mật khẩu không được để trống");
    } else if (newPassword.length < 6) {
      errors.push("Mật khẩu phải có ít nhất 6 ký tự");
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.push("Mật khẩu phải chứa ít nhất 1 chữ hoa");
    } else if (!/[0-9]/.test(newPassword)) {
      errors.push("Mật khẩu phải chứa ít nhất 1 số");
    }

    if (errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: errors[0],
      });
    }

    //  Cập nhật mật khẩu
    const hashedPassword = crypto.createHash('md5').update(newPassword).digest('hex');
    const updateQuery = 'UPDATE user SET password = ? WHERE  id = ?';
    await database.connectDatabase(updateQuery, [hashedPassword, id]);
    return res.status(200).json({
      success: true,
      message: "Sửa mật khẩu thành công",
      data: req.user
    });
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      success: false,
      message: "Da xay ra loi trong qua trinh lay lai mat khau"
    })
  }
}
