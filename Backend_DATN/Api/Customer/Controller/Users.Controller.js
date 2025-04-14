const database = require('../../../Config/DataBase');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Kiểm tra JWT_SECRET
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    process.exit(1);
}

module.exports.register = async (req, res) => {
    const { name, email, phone, password, confirmPassword, is_owner } = req.body;
    console.log(req.body);

    // Hash password using MD5
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');

    // Kiểm tra nếu email đã tồn tại
    const checkEmailCustomer = 'SELECT * FROM customer WHERE email = ?';
    const emailCheckCustomer = await database.connectDatabase(checkEmailCustomer, [email]);
    const checkEmailOwner = 'SELECT * FROM owner WHERE email = ?';
    const emailCheckowner = await database.connectDatabase(checkEmailOwner, [email]);

    if (emailCheckCustomer.length > 0||emailCheckowner.length > 0) {
        // Nếu email đã tồn tại
        return res.status(400).json({
            success: false,
            message: "Email đã tồn tại",
        });
    }

    // Nếu email chưa tồn tại, tiếp tục chèn dữ liệu vào bảng user
    const query = `
        INSERT INTO user (email, password, is_active, is_owner, date_joined) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    const values = [email, hashedPassword, 1, parseInt(is_owner)];

    const userResult = await database.connectDatabase(query, values);
    const userId = userResult.insertId;

   
    if (parseInt(is_owner) == 0) {
        const customerQuery = `
            INSERT INTO customer (name, email, phone_number, user_id, balance) 
            VALUES (?, ?, ?, ?, 0)
        `;
        const customerValues = [name, email, phone, userId];
        await database.connectDatabase(customerQuery, customerValues);
    } else {
        const ownerQuery = `
            INSERT INTO owner (name, email, phone_number, user_id, balance) 
            VALUES (?, ?, ?, ?, 0)
        `;
        const ownerValues = [name, email, phone, userId];
        await database.connectDatabase(ownerQuery, ownerValues);
    }

  

    res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
            user_id: userId,
            name: name,
            email: email,
            phone: phone,
            is_owner: is_owner,
            date_joined: new Date().toISOString()
        }
    });
};

module.exports.login=async(req,res)=>{
    const { email, password } = req.body;
    // Giải mã mật khẩu
    
try{
    const query = 'SELECT * FROM user WHERE email = ?';
    const userResult = await database.connectDatabase(query, [email]);

    if (userResult.length === 0) {
        return res.status(401).json({
            success: false,
            message: "email không chính xác"
        });
    }

    const user = userResult[0];
     // Giải mã mật khẩu
     const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    // Kiểm tra mật khẩu
    if (hashedPassword!== user.password) {
        return res.status(401).json({
            success: false,
            message: "Mật khẩu không chính xác"
        });
    }
  
     // Tạo JWT token
     const token = jwt.sign(
        { 
            userId: user.id,
            email: user.email,
            is_owner: user.is_owner
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Set cookie options
    const cookieOptions = {
        httpOnly: true, // Cookie không thể truy cập bằng JavaScript
        secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong production
        sameSite: 'strict', // Bảo vệ chống CSRF
        maxAge: 24 * 60 * 60 * 1000 // 24 giờ
    };

    // Set token vào cookie
    res.cookie('token', token, cookieOptions);

    console.log(token)
    res.status(200).json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
            user_id: user.id,
            name: user.username,
            email: user.email,
            is_owner: user.is_owner,
            date_joined: user.date_joined // Nếu bạn có trường này trong bảng user
        }
    });
}catch(error){
    console.log(error.message);
    res.status(500).json({
        success: false,
        message: "Đã xảy ra lỗi trong quá trình đăng nhập"
    });
}
}
