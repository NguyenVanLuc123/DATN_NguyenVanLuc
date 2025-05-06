// Api/Customer/Controller/Booking.controller.js
const database = require('../../../Config/DataBase');
const { generateBookingId } = require('../../../helper/generateBookingid');
const sendmailHelper = require('../../../helper/sendMail');
require("dotenv").config();
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
module.exports.BookingPost = async (req, res) => {
  const {
    car_id,
    driver_info,
    pickup_datetime,
    return_datetime,
    payment_method,
    total_amount,
    deposit_amount,
    pickUpLocation,
    drivingLicense,
    days
  } = req.body;

  if (req.user.is_owner == 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }

  const pool = database.pool;
  const conn = await pool.getConnection();

  try {

    await conn.beginTransaction();

    // Khóa và kiểm tra trạng thái xe
    const [carRows] = await conn.query(
      'SELECT status FROM car WHERE id = ? FOR UPDATE',
      [car_id]
    );

    if (carRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Xe không tồn tại' });
    }
    if (carRows[0].status !== 'available') {
      await conn.rollback();

      return res.status(409).json({ success: false, message: 'Xe đang bận ' });
    }

    // Cập nhật trạng thái xe thành 'busy'
    await conn.query(
      'UPDATE car SET status = ? WHERE id = ?',
      ['busy', car_id]
    );


    const {
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      nationalId,
      city,
      district,
      ward,
      drivingLicense: innerDrivingLicense
    } = driver_info || {};

    const driver_address = [ward, district, city].filter(Boolean).join(', ');
    const licenseToUse = drivingLicense || innerDrivingLicense;
    const customer_id = req.user.id;
    const startDT = new Date(pickup_datetime)
      .toISOString().slice(0, 19).replace('T', ' ');
    const endDT = new Date(return_datetime)
      .toISOString().slice(0, 19).replace('T', ' ');
    const method = (payment_method || 'WALLET').toUpperCase();

    //Chừ tiền nếu phướng thức thanh toán là wallet
    if (method === 'WALLET') {
      const updateBalanceSql = `
        UPDATE customer
        SET balance = balance - ?
        WHERE id = ?
      `;
      await conn.query(updateBalanceSql, [
        deposit_amount,
        req.user.id
      ]);
    }
    if (method === 'WALLET' || method === 'BANKING') {
      const updateBalanceSql = `
    UPDATE owner
SET balance = balance + ?
WHERE id = (
  SELECT owner_id
  FROM car
  WHERE id = ?
);
    `;
      await conn.query(updateBalanceSql, [
        deposit_amount,
        car_id
      ]);
    }

    const bookingId = await generateBookingId();


    const insertBookingSql = `
      INSERT INTO booking (
        id,
        start_date, end_date, pick_up_location, return_location,
        status, car_id, customer_id, method,
        driver_name, driver_email, driver_address,
        driver_phone_number, driver_driving_license,
        driver_date_of_birth, driver_national_id,total_amount,deposit_amount,days
      ) VALUES (
        ?,  ?,           ?,         ?,              ?,
        ?,      ?,      ?,            ?,
        ?,           ?,           ?,
        ?,                   ?,                   ?,                    ?,          ?,        ?,        ?
      )
    `;
    const values = [
      bookingId,          // 1
      startDT,            // 2
      endDT,              // 3
      pickUpLocation,     // 4
      null,               // 5 return_location
      'PENDING_DEPOSIT',  // 6
      car_id,             // 7
      customer_id,        // 8
      method,             // 9
      fullName || null,   // 10
      email || null,   // 11
      driver_address || null, // 12
      phoneNumber || null, // 13
      licenseToUse || null, // 14
      dateOfBirth
        ? new Date(dateOfBirth).toISOString().slice(0, 19).replace('T', ' ')
        : null,           // 15
      nationalId || null , // 16
      total_amount,
      deposit_amount,
      days
    ];
    await conn.query(insertBookingSql, values);
    // tạo bản ghi transaction
    const type = "DEPOSIT_PAYMENT";
    const createdDate = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    const insertPaymentSql = `
    INSERT INTO transaction (
      amount,
      created_date,
      method,
      type,
      booking_id
    ) VALUES (?, ?, ?, ?, ?)
  `;

    const valuesTransaction = [
      deposit_amount,
      createdDate,
      method,
      type,
      bookingId
    ];
    await conn.query(insertPaymentSql, valuesTransaction);
    //  Commit transaction
    await conn.commit();

    // 1) Lấy tên chủ xe từ DB
    const [ownerRows] = await conn.query(
      `SELECT o.name
   FROM owner o
   JOIN car c ON c.owner_id = o.id
   WHERE c.id = ?`,
      [car_id]
    );
    const ownerName = ownerRows[0]?.name || 'Chủ xe';

    // 2) Tiêu đề và nội dung mail
    const subject = `Khách hàng ${fullName || '---'} đã đặt xe #${bookingId}`;

    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px;">
  <h2 style="color: #2c3e50;">🚗 Thông tin đặt xe mới từ khách hàng</h2>
  <p>Chào <strong>${ownerName}</strong>,</p>
  <p>Bạn vừa nhận được một đơn đặt xe mới. Vui lòng kiểm tra thông tin bên dưới và xác nhận trong thời gian quy định.</p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Họ tên người thuê</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${fullName}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Email</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Số điện thoại</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${phoneNumber}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>CCCD</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${nationalId}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Địa chỉ</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${driver_address}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Ngày sinh</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${dateOfBirth}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Giấy phép lái xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${licenseToUse}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Thời gian nhận xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${pickup_datetime}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Thời gian trả xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${return_datetime}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Địa điểm nhận xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${pickUpLocation}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Phương thức thanh toán</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">
        ${
          method === 'WALLET'
            ? 'Ví nội bộ'
            : method === 'BANK_TRANSFER'
            ? 'Chuyển khoản ngân hàng'
            : 'Tiền mặt'
        }
      </td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Tiền cọc</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${deposit_amount} VND</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Tổng số tiền</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${total_amount} VND</td>
    </tr>
  </table>

  <tr>
    <td colspan="2" style="padding:12px; margin-top:20px; border:1px solid #ddd; background-color:#fff3cd; color:#856404;">
      <strong>⏰ Cảnh báo:</strong> Đơn đặt xe này sẽ chỉ tồn tại trong <strong>15 phút</strong>. Vui lòng xác nhận ngay để tránh mất booking.
    </td>
  </tr>

  <tr>
    <td colspan="2" style="padding:12px; border:1px solid #ddd; background-color:#e2e3e5; color:#383d41;">
      <p><strong>Lưu ý:</strong> Khách hàng thanh toán bằng <em>ví nội bộ</em> hay <em>chuyển khoản ngân hàng</em> — chúng tôi đều <u>chuyển tiền vào ví nội bộ</u> của bạn. Hãy kiểm tra thật kỹ!</p>
    </td>
  </tr>

  <p style="margin-top: 20px;">Trân trọng,<br><strong>Hệ thống cho thuê xe</strong></p>
</div>

`;
    const emailUser = 'alaluclun11032003@gmail.com';
    // 3) Gửi mail cho Owner bằng email mặc định
    sendmailHelper.sendmail(emailUser, subject, html); // Email vẫn lấy từ session như ban đầu

    return res.status(201).json({
      success: true,
      message: 'Tạo booking thành công',
      data: { bookingId }
    });

  } catch (error) {
    // Rollback nếu có lỗi
    await conn.rollback();
    console.error('Lỗi BookingPost (transaction):', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình đặt xe'
    });
  } finally {
    conn.release();
  }
};

module.exports.listBooking=async(req,res)=>{
  const customer_id=req.user.id;
  if(req.user.is_owner===1){
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền '
    });
  }
  try{

    const listBookingsql=`select *from booking where customer_id =?`

    const listresuilt= await database.connectDatabase(listBookingsql,[customer_id]);

    for (let booking of listresuilt) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
     
      booking.car_id=carRows[0];
      // gắn thông tin car vào booking
    }
    const customer = await database.connectDatabase(
      'SELECT * FROM customer WHERE id = ?',
      [customer_id]
    );
    customer[0].is_owner=req.user.is_owner;
    
    return res.status(200).json({
      success: true,
      message: 'Danh sach listbooking ',
      data: listresuilt,
      user:customer[0]
    });

  }catch(err){
    console.log(err.message)
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá lấy danh sách bookingbooking'
    });
  }
}
module.exports.bookingDetail=async(req,res)=>{
  const customer_id=req.user.id;
  const booking_id=req.params.id;
  if(req.user.is_owner===1){
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền '
    });
  }
  try{

    const listBookingsql=`select *from booking where customer_id =? and id=?`

    const listresuilt= await database.connectDatabase(listBookingsql,[customer_id,booking_id]);
var car_id;
    for (let booking of listresuilt) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
     car_id=booking.car_id;
      booking.car_id=carRows[0];
      // gắn thông tin car vào booking
    }
    //ban car-additional
    const car_additional_function = await database.connectDatabase(
      'SELECT * FROM car_additional_function WHERE car_id = ?',
      [car_id]
    );
    //car_teem_of_use

    const car_term_of_use = await database.connectDatabase(
      'SELECT * FROM car_term_of_use WHERE car_id = ?',
      [car_id]
    );
    const customer = await database.connectDatabase(
      'SELECT * FROM customer WHERE id = ?',
      [customer_id]
    );
    customer[0].is_owner=req.user.is_owner;
    
    return res.status(200).json({
      success: true,
      message: 'Danh sach listbooking ',
      data: listresuilt,
      user:customer[0],
      car_additional_function:car_additional_function[0],
      car_teem_of_use:car_term_of_use[0]
    });

  }catch(err){
    console.log(err.message)
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá lấy danh sách bookingbooking'
    });
  }
}

module.exports.bookingDetailput=async(req,res)=>{
  const{booking_id,driver_info}=req.body;
  if(req.user.is_owner===1){
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  try{
    
    const Bookingresult= await database.connectDatabase('select * from booking where id=?',[booking_id]);
    var drivingLicense ='';
    if(req.body.drivingLicense){
      drivingLicense=req.body.drivingLicense;
    }
    else if(driver_info.drivingLicense){
      drivingLicense=driver_info.drivingLicense;
    }
    
   
    if(Bookingresult.length>0){
      if(!drivingLicense){
        drivingLicense=Bookingresult[0].driver_driving_license;
      }
    }

    const address=driver_info.ward+", "+driver_info.district+", "+ driver_info.city;
    const date = new Date(driver_info.dateOfBirth);
    date.setDate(date.getDate() + 1); // cộng thêm 1 ngày
    const dateOnly = date.toISOString().split('T')[0];
    const bookingsql=`UPDATE booking
SET driver_name = ?, driver_email =?, driver_address =?,
        driver_phone_number =?, driver_driving_license=?,
        driver_date_of_birth= ?, driver_national_id =?
WHERE id=?;`
    await database.connectDatabase(bookingsql,[driver_info.fullName,driver_info.email,address,driver_info.phoneNumber,drivingLicense,dateOnly,driver_info.nationalId,booking_id])

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật Booking thành công !'
    });

  }catch(err){
    console.error('Lỗi BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình cập nhật Booking'
    });
  }
}
module.exports.BookingCancel=async(req,res)=>{
  const booking_id=req.params.id;
  if(req.user.is_owner===1){
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  try{
    

    const bookingsql=`UPDATE booking
SET status= ?
WHERE id=? AND (status="PENDING_DEPOSIT" OR status="CONFIRMED")
`
    await database.connectDatabase(bookingsql,['STOPPED',booking_id]);

    const Bookingresult= await database.connectDatabase('select *from booking where id =?',[booking_id]);
    const BookingresultMycar= await database.connectDatabase('select *from booking where customer_id =?',[req.user.id]);
    for (let booking of BookingresultMycar) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
     
      booking.car_id=carRows[0];
      // gắn thông tin car vào booking
    }
    for (let booking of Bookingresult) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
      booking.car_id=carRows[0];
      // gắn thông tin car vào booking
    }
    console.log(BookingresultMycar);
    return res.status(200).json({
      success: true,
      message: 'Đã Cancel Booking thành công !',
      data:Bookingresult,
      BookingresultMycar:BookingresultMycar
    });

  }catch(err){
    console.error('Lỗi Cancel BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình Cancel Booking'
    });
  }
}


const VNPAY_BASE_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const MERCHANT_CODE = process.env.VNP_TMN_CODE;
const SECRET_KEY = process.env.VNP_HASH_SECRET;

function sortObject(obj) {
  // Lấy mảng key và sort
  const keys = Object.keys(obj).sort();
  const sorted = {};
  for (const key of keys) {
    // Encode value và thay space thành '+'
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  }
  return sorted;
}

module.exports.create_vnpay_payment = async (req, res) => {
  try {
    const { amount, returnUrl } = req.body;
    const date = new Date();

    // 1) Build object params
    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: MERCHANT_CODE,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: moment(date).format('DDHHmmss'),
      vnp_OrderInfo: 'Thanh toan cho ma GD:' + moment(date).format('DDHHmmss'),
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_CreateDate: moment(date).format('YYYYMMDDHHmmss'),
      vnp_BankCode: 'VNBANK'
    };

    // 2) Sort và build data để ký
    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });

    // 3) Tạo chữ ký HMAC SHA512
    const hmac = crypto.createHmac('sha512', SECRET_KEY);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // 4) Gắn secure hash và build URL
    sortedParams.vnp_SecureHash = signed;
    const paymentUrl = `${VNPAY_BASE_URL}?${qs.stringify(sortedParams, { encode: false })}`;

    console.log('🔶 VNPay URL:', paymentUrl);
    return res.json({ url: paymentUrl });

  } catch (err) {
    console.error('❌ create_vnpay_payment error:', err);
    return res.status(500).json({
      success: false,
      message: 'Không tạo được payment URL'
    });
  }
};

module.exports.confirm_vnpay_payment = async (req, res) => {
  try {
    const car_id = req.params.id;
    const vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;
    const returnUrl = vnp_Params.vnp_ReturnUrl;  // VNP trả về nguyên
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', SECRET_KEY);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const success = secureHash === signed && sortedParams.vnp_ResponseCode === '00';

    // Redirect về frontend với param paid
    const redirectUrl = new URL(`http://localhost:3001/vnpay-return.html?paid=${success}`);
    redirectUrl.searchParams.set('paid', success ? 'true' : 'false');
    redirectUrl.searchParams.set('step', '2');    // ← thêm param step=2
    return res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error(err);
    // nếu lỗi, cũng redirect về với paid=false
    return res.redirect('http://localhost:3000/payment/return?paid=false');
  }
};