const database = require('../../../Config/DataBase');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const generateNumber=require('../../../helper/generateRandomNumber');
const sendmailHelper=require("../../../helper/sendMail");
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
    console.log(userResult)

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
module.exports.forgotPassword=async(req,res)=>{
    const {email}=req.body;
    try{
        const query = 'SELECT * FROM user WHERE email = ?';
        const userResult = await database.connectDatabase(query, [email]);
        console.log(email);
        if(userResult.length==0){
            return res.status(400).json({
                success:false,
                message:"Tài khoản không tồn tại "
            });
        }
        

        const OTP=generateNumber.generate(6);
        const subject="Mã OTP xác minh lấy lại mật khẩu !";


        const html=`
        Mã OPT xác minh là : <b>${OTP}.</b> luu y khong duoc de lo ma otp thoi han su dung la 60s
        `  // Set cookie options
        const otpOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 1000 // 1 phút
        };
        
        const emailOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 5* 60 * 1000 
        };
        
        // Gửi 2 cookie với thời gian sống khác nhau
       
        res.cookie('OTP', OTP, otpOptions);
        res.cookie('email', email, emailOptions);
        sendmailHelper.sendmail(email,subject,html);
        res.status(200).json({
            success: true,
            message: "Đã gửi mã OTP",
            data: userResult[0]
        });

    }catch(error){
        console.log(error.message)
        res.status(500).json({
            success:false,
            message:"Da xay ra loi trong qua trinh lay lai mat khau"
        })
    }
}
module.exports.otpPassword=async(req,res)=>{
    try{
        const otpFromCookie = req.cookies.OTP;
        const {otp}=req.body;
        console.log(otpFromCookie)
        if(otpFromCookie!=otp){
            return res.status(400).json({
                success:false,
                message:"Mã OTP không chính xác"
            });
        }
        const verify=true;
        const cookieOptions = {
            httpOnly: true, // Cookie không thể truy cập bằng JavaScript
            secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong production
            sameSite: 'strict', // Bảo vệ chống CSRF
            maxAge:5*60 * 1000 
        };
    
        // Set token vào cookie
        res.cookie('verify',verify, cookieOptions);
        return res.status(200).json({
            success:true,
            message:"Xác thực thành công"
        });
    }catch(error){
        console.log(error.message)
        res.status(500).json({
            success:false,
            message:"Da xay ra loi trong qua trinh lay lai mat khau"
        })
    }
}
module.exports.ChangePassword=async(req,res)=>{
    try{
        const otpFromCookie = req.cookies.verify;
        const email= req.cookies.email;
        const {newPassword}=req.body;
        console.log(newPassword)
        if(!otpFromCookie){
            return res.status(400).json({
                success:false,
                message:"Bạn chưa xác thực "
            });
        }
         //  Cập nhật mật khẩu
         const hashedPassword = crypto.createHash('md5').update(newPassword).digest('hex');
         const updateQuery = 'UPDATE user SET password = ? WHERE email = ?';
         await database.connectDatabase(updateQuery, [hashedPassword, email]);
         return res.status(200).json({
            success:true,
            message:"Sửa mật khẩu thành công"
        });
    }catch(error){
        console.log(error.message)
        res.status(500).json({
            success:false,
            message:"Da xay ra loi trong qua trinh lay lai mat khau"
        })
    }
}