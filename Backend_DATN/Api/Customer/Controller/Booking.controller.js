// Api/Customer/Controller/Booking.controller.js
const database = require('../../../Config/DataBase');
const { generateBookingId } = require('../../../helper/generateBookingid');
const sendmailHelper = require('../../../helper/sendMail');
require("dotenv").config();
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const getVietnamDateTime= require('../../../helper/getDateTime');
module.exports.BookingPost = async (req, res) => {
  const customer_id = req.user.id;
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
  console.log(req.body);
 
  if (req.user.is_owner == 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }

  const pool = database.pool;
  const conn = await pool.getConnection();
  const createdDate =getVietnamDateTime();
  try {

    await conn.beginTransaction();
    const user_id_customer = await database.connectDatabase("select user_id from customer where id = ? ", [customer_id])
    // Khóa và kiểm tra trạng thái xe
    const [carRows] = await conn.query(
      'SELECT status FROM car WHERE id = ? FOR UPDATE',
      [car_id]
    );

    if (carRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Xe không tồn tại' });
    }
    if (carRows[0].status !== 'available' && payment_method=="banking" ) {
      await conn.rollback();
      console.log(deposit_amount)
      
      console.log(req.body)
      await database.connectDatabase("UPDATE customer set balance =balance + ? where id=?",[deposit_amount,req.user.id]);

      await database.connectDatabase(` INSERT INTO transaction (
    amount,
    created_date,
     method,
     type,
     user_id
      ) VALUES (?, ?, ?, ?, ?)`,[deposit_amount,createdDate,"WALLET","REFUND",user_id_customer[0].user_id]);
      return res.status(200).json({status:"refund", success: true , message: 'Xe đang bận chúng tôi xẽ hoàn lại tiền vào ví ' });
    }
    else if (carRows[0].status !== 'available') {
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
  
    const startDT = new Date(pickup_datetime)
      .toISOString().slice(0, 19).replace('T', ' ');
    const endDT = new Date(return_datetime)
      .toISOString().slice(0, 19).replace('T', ' ');
    const method = (payment_method || 'WALLET').toUpperCase();
    // tạo bản ghi transaction

    
  
    const user_id_owner = await database.connectDatabase(`select user_id from owner where id = (SELECT owner_id FROM car WHERE id = ?) `,[car_id])
    const type = "DEPOSIT_PAYMENT";
    const insertPaymentSql = `
    INSERT INTO transaction (
    amount,
    created_date,
     method,
     type,
     user_id
      ) VALUES (?, ?, ?, ?, ?)
    `;

  
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
      const valuesTransaction = [
        -deposit_amount,
        createdDate,
        method,
        type,
        user_id_customer[0].user_id
      ];
      await conn.query(insertPaymentSql, valuesTransaction);
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
      const valuesTransaction = [
        deposit_amount,
        createdDate,
        method,
        type,
        user_id_owner[0].user_id
      ];
      await conn.query(insertPaymentSql, valuesTransaction);
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
      nationalId || null, // 16
      total_amount,
      deposit_amount,
      days
    ];
    await conn.query(insertBookingSql, values);

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
        ${method === 'WALLET'
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

    return res.status(200).json({
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

module.exports.listBooking = async (req, res) => {
  const customer_id = req.user.id;
  if (req.user.is_owner === 1) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền '
    });
  }
  try {

    const listBookingsql = `select *from booking where customer_id =?`

    const listresuilt = await database.connectDatabase(listBookingsql, [customer_id]);

    for (let booking of listresuilt) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );

      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }
    const customer = await database.connectDatabase(
      'SELECT * FROM customer WHERE id = ?',
      [customer_id]
    );
    customer[0].is_owner = req.user.is_owner;

    return res.status(200).json({
      success: true,
      message: 'Danh sach listbooking ',
      data: listresuilt,
      user: customer[0]
    });

  } catch (err) {
    console.log(err.message)
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá lấy danh sách bookingbooking'
    });
  }
}
module.exports.bookingDetail = async (req, res) => {
  const customer_id = req.user.id;
  const booking_id = req.params.id;
  if (req.user.is_owner === 1) {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền '
    });
  }
  try {

    const listBookingsql = `select *from booking where customer_id =? and id=?`

    const listresuilt = await database.connectDatabase(listBookingsql, [customer_id, booking_id]);
    var car_id;
    for (let booking of listresuilt) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
      car_id = booking.car_id;
      booking.car_id = carRows[0];
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
    customer[0].is_owner = req.user.is_owner;

    return res.status(200).json({
      success: true,
      message: 'Danh sach listbooking ',
      data: listresuilt,
      user: customer[0],
      car_additional_function: car_additional_function[0],
      car_teem_of_use: car_term_of_use[0]
    });

  } catch (err) {
    console.log(err.message)
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá lấy danh sách bookingbooking'
    });
  }
}

module.exports.bookingDetailput = async (req, res) => {
  const { booking_id, driver_info } = req.body;
  if (req.user.is_owner === 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  try {

    const Bookingresult = await database.connectDatabase('select * from booking where id=?', [booking_id]);
    var drivingLicense = '';
    if (req.body.drivingLicense) {
      drivingLicense = req.body.drivingLicense;
    }
    else if (driver_info.drivingLicense) {
      drivingLicense = driver_info.drivingLicense;
    }


    if (Bookingresult.length > 0) {
      if (!drivingLicense) {
        drivingLicense = Bookingresult[0].driver_driving_license;
      }
    }

    const address = driver_info.ward + ", " + driver_info.district + ", " + driver_info.city;
    const date = new Date(driver_info.dateOfBirth);
    date.setDate(date.getDate() + 1); // cộng thêm 1 ngày
    const dateOnly = date.toISOString().split('T')[0];
    const bookingsql = `UPDATE booking
SET driver_name = ?, driver_email =?, driver_address =?,
        driver_phone_number =?, driver_driving_license=?,
        driver_date_of_birth= ?, driver_national_id =?
WHERE id=?;`
    await database.connectDatabase(bookingsql, [driver_info.fullName, driver_info.email, address, driver_info.phoneNumber, drivingLicense, dateOnly, driver_info.nationalId, booking_id])

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật Booking thành công !'
    });

  } catch (err) {
    console.error('Lỗi BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình cập nhật Booking'
    });
  }
}
module.exports.BookingCancel = async (req, res) => {
  const booking_id = req.params.id;
  if (req.user.is_owner === 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  
  try {


    const checkBooking = await database.connectDatabase(`select * from booking where id= ? AND (status="PENDING_DEPOSIT" OR status="CONFIRMED") `,[booking_id]);

    if(checkBooking.length==0){
      return res.status(403).json({ success: false, message: "Bạn đã nhận xe không thể hủy bookingbooking " });
    }

    const checkCustomer =await database.connectDatabase('select *from booking where id =? and customer_id =?', [booking_id,req.user.id]);
    if(checkCustomer.length==0){
      return res.status(403).json({ success: false, message: "Tào khoản này không có quyền  " });
    }

    const bookingsql = `UPDATE booking
SET status= ?
WHERE id=? 
`
    await database.connectDatabase(bookingsql, ['STOPPED', booking_id]);

    const Bookingresult = await database.connectDatabase('select *from booking where id =? ', [booking_id]);
    const BookingresultMycar = await database.connectDatabase('select *from booking where customer_id =?', [req.user.id]);



    for (let booking of BookingresultMycar) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );

      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }
    for (let booking of Bookingresult) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }
 


    //hoàn tiền customer về hết ví wallet

    await database.connectDatabase('UPDATE customer set balance = balance + ? where id =?', [Bookingresult[0].deposit_amount, req.user.id])

    const user_id_customer = await database.connectDatabase("select user_id from customer where id = ? ", [req.user.id])
    const user_id_owner = await database.connectDatabase(`select user_id from owner where id = ?`,[Bookingresult[0].car_id.owner_id])
    const type = "REFUND";
    const createdDate = getVietnamDateTime();
    const insertPaymentSql = `
    INSERT INTO transaction (
    amount,
    created_date,
     method,
     type,
     user_id
      ) VALUES (?, ?, ?, ?, ?)
    `;
    const valuesTransactionCustomer = [
      Bookingresult[0].deposit_amount,
      createdDate,
      Bookingresult[0].method,
      type,
      user_id_customer[0].user_id
    ];
    await database.connectDatabase(insertPaymentSql, valuesTransactionCustomer);
    //trừ tiền trong ví owner 

    await database.connectDatabase('UPDATE owner set balance = balance - ? where id =?', [Bookingresult[0].deposit_amount, Bookingresult[0].car_id.owner_id])

    const valuesTransactionOwne = [
      -Bookingresult[0].deposit_amount,
      createdDate,
      Bookingresult[0].method,
      type,
      user_id_owner[0].user_id
    ];
    await database.connectDatabase(insertPaymentSql, valuesTransactionOwne);
    // trả lại trạng thái xe

    await database.connectDatabase('UPDATE car set status ="available" where id =?', [Bookingresult[0].car_id.id])

    return res.status(200).json({
      success: true,
      message: 'Đã Cancel Booking thành công !',
      data: Bookingresult,
      BookingresultMycar: BookingresultMycar
    });

  } catch (err) {
    console.error('Lỗi Cancel BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình Cancel Booking'
    });
  }
}

module.exports.In_progress=async(req,res)=>{
  const booking_id = req.params.id;
  if (req.user.is_owner === 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  try{
    
   
const startDate = getVietnamDateTime();

const checkBookingConfirm = await database.connectDatabase("select * from booking where id= ? and status ='CONFIRMED' ",[booking_id]);

if(checkBookingConfirm.length==0){
  return res.status(403).json({ success: false, message: "Booking không ở trạng thái CONFIRMED " });
}
const checkCustomer =await database.connectDatabase('select *from booking where id =? and customer_id =?', [booking_id,req.user.id]);
if(checkCustomer.length==0){
  return res.status(403).json({ success: false, message: "Tào khoản này không có quyền  " });
}

    const bookingsql = `UPDATE booking
SET status= ? ,start_date = ?
WHERE id=?  
`
    await database.connectDatabase(bookingsql, ['IN_PROGRESS',startDate, booking_id]);

    const Bookingresult = await database.connectDatabase('select *from booking where id =?', [booking_id]);
    const BookingresultMycar = await database.connectDatabase('select *from booking where customer_id =?', [req.user.id]);
    
    for (let booking of BookingresultMycar) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );

      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }
    for (let booking of Bookingresult) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }

    
    return res.status(200).json({
      success: true,
      message: 'Đã nhận xe thành công !',
      data: Bookingresult,
      BookingresultMycar: BookingresultMycar
    });

  }catch(err){
    console.error('Lỗi Cancel BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình xác nhận nhận xe'
    });
  }
}
module.exports.Totalpayment=async(req,res)=>{
  const booking_id = req.params.id;
  if (req.user.is_owner === 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  try{
    
    const bookingresult= await database.connectDatabase("select * from booking where id =? and status ='IN_PROGRESS'",[booking_id])
    if(bookingresult.length==0){
      return res.status(403).json({ success: false, message: "Booking không ở trạng thái IN_PROGRESS " });
    }
    const checkCustomer =await database.connectDatabase('select *from booking where id =? and customer_id =?', [booking_id,req.user.id]);
    if(checkCustomer.length==0){
      return res.status(403).json({ success: false, message: "Tào khoản này không có quyền  " });
    }
    const end_date = getVietnamDateTime(); // Thời điểm hiện tại
    const booking = bookingresult[0];
    
    // Làm tròn start_date như end_date
    let start_date = new Date(booking.start_date);
    if (start_date.getHours() >= 12) {
      start_date.setDate(start_date.getDate() + 1);
    }
    start_date.setHours(0, 0, 0, 0);
    // Làm tròn end_date
    let actualEnd = new Date(end_date);
    if (actualEnd.getHours() >= 12) {
      actualEnd.setDate(actualEnd.getDate() + 1);
    }
    actualEnd.setHours(0, 0, 0, 0);
    
    // Tính số ngày thuê
    let rentedDays = Math.floor((actualEnd - start_date) / (1000 * 60 * 60 * 24));
   
    if (rentedDays === 0) {
      rentedDays = 1;
    }


    
    // Tính tiền
    const perDayPrice = booking.total_amount / booking.days;
    const daysTotal = rentedDays * perDayPrice - booking.deposit_amount;

    console.log(perDayPrice)

    
    return res.status(200).json({
      success: true,
      message: 'Số tiền còn lại !',
      day:rentedDays,
      daysTotal:daysTotal
      
    });

  }catch(err){
    console.error('Lỗi Cancel BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá Lấy số tiền còn lại phải thanh toán '
    });
  }
}

module.exports.ReturnCar= async(req,res)=>{
  const booking_id = req.params.id;
  const total_amount= req.params.total;
  if (req.user.is_owner === 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }
  try{
    const EndDate = getVietnamDateTime();

const checkBookingConfirm = await database.connectDatabase("select * from booking where id= ? and status ='IN_PROGRESS' ",[booking_id]);

if(checkBookingConfirm.length==0){
  return res.status(403).json({ success: false, message: "Booking không ở trạng thái IN_PROGRESS " });
}

 //tạo giao dịch trừ tiên customer
 const balance= await database.connectDatabase('select balance from customer where id =?',[req.user.id]);
 if(balance[0].balance<total_amount){
  return res.status(403).json({ success: false, message: "Ví không đủ tiền " });
 }
 const checkCustomer =await database.connectDatabase('select *from booking where id =? and customer_id =?', [booking_id,req.user.id]);
 if(checkCustomer.length==0){
   return res.status(403).json({ success: false, message: "Tào khoản này không có quyền  " });
 }

    const bookingsql = `UPDATE booking
      SET status= ? ,end_date = ?,days=?,total_amount =?
       WHERE id=?  
     `

    

    await database.connectDatabase(bookingsql, ['PENDING_PAYMENT',EndDate,req.body.day_rental,total_amount ,booking_id]);

    const Bookingresult = await database.connectDatabase('select *from booking where id =?', [booking_id]);
    const BookingresultMycar = await database.connectDatabase('select *from booking where customer_id =?', [req.user.id]);
    
    for (let booking of BookingresultMycar) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );

      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }
    for (let booking of Bookingresult) {
      const carRows = await database.connectDatabase(
        'SELECT * FROM car WHERE id = ?',
        [booking.car_id]
      );
      booking.car_id = carRows[0];
      // gắn thông tin car vào booking
    }

    

     await database.connectDatabase("UPDATE customer set balance= balance - ? where id =?",[total_amount,req.user.id])

     const user_id_customer = await database.connectDatabase("select user_id from customer where id = ? ", [req.user.id])
     const user_id_owner = await database.connectDatabase(`select user_id from owner where id = ?`,[Bookingresult[0].car_id.owner_id])
     const type = "PAYMENT";
     const createdDate =getVietnamDateTime()
     const insertPaymentSql = `
     INSERT INTO transaction (
     amount,
     created_date,
      method,
      type,
      user_id
       ) VALUES (?, ?, ?, ?, ?)
     `;
     const valuesTransactionCustomer = [
       -total_amount,
       createdDate,
       "WALLET",
       type,
       user_id_customer[0].user_id
     ];
     await database.connectDatabase(insertPaymentSql, valuesTransactionCustomer); 


        //cộng tiền ví owner
        await database.connectDatabase('UPDATE owner set balance = balance + ? where id =?', [total_amount, Bookingresult[0].car_id.owner_id])

        const valuesTransactionOwne = [
          total_amount,
          createdDate,
          'WALLET',
          type,
          user_id_owner[0].user_id
        ];
        await database.connectDatabase(insertPaymentSql, valuesTransactionOwne);

        //send email
        
    const [ownerRows] = await database.connectDatabase(
      `SELECT name
   FROM owner 
   WHERE id = ?`,
      [Bookingresult[0].car_id.owner_id]
    );

    
    const ownerName = ownerRows[0]?.name || 'Chủ xe';

    // 2) Tiêu đề và nội dung mail
    const subject = `Khách hàng ${Bookingresult[0].driver_name || '---'} đã thanh toán nốt số tiền  #${Bookingresult[0].id}`;

    const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ccc; padding: 20px;">
  <h2 style="color: #2c3e50;">🚗 Thông tin khách hàng</h2>
  <p>Chào <strong>${ownerName}</strong>,</p>
  <p>Bạn vừa nhận được số tiền thanh toán còn lại Vui lòng kiểm tra ví và xác nhận trong thời gian quy định.</p>

  <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Họ tên người thuê</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_name}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Email</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_email}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Số điện thoại</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_phone_number}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>CCCD</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_national_id}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Địa chỉ</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_address}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Ngày sinh</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_date_of_birth}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Giấy phép lái xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].driver_driving_license}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Thời gian nhận xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].start_date}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Thời gian trả xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].end_date}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Địa điểm nhận xe</strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${Bookingresult[0].pick_up_location}</td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Phương thức thanh toán</strong></td>
      <td style="padding:8px; border:1px solid #ddd;"><strong>Ví nội bộ </strong></td>
    </tr>
    <tr>
      <td style="padding:8px; border:1px solid #ddd;"><strong> số tiền Thanh toán </strong></td>
      <td style="padding:8px; border:1px solid #ddd;">${total_amount} VND</td>
    </tr>
  </table>


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

  
    return res.status(200).json({
      success: true,
      message: 'Đã thanh toán thành công !',
      data: Bookingresult,
      BookingresultMycar: BookingresultMycar
    });
  }catch(err){
    console.error('Lỗi Cancel BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình trảtrả nhận xe'
    });
  }
}
module.exports.Feedback=async(req,res)=>{
  
  const car_id=req.params.car_id;
 const{rating,report}=req.body
  if (req.user.is_owner === 1) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }


  try{
    const creat_date=getVietnamDateTime();

    const owner_id= await database.connectDatabase("select owner_id from car where id =?",[car_id]);
    await database.connectDatabase(` INSERT INTO feedback (
     rating,
     comment,
     created_date,
     customer_id,
     car_id,
     owner_id
       ) VALUES (?, ?, ?, ?, ? ,?)`,[rating,report,creat_date,req.user.id,car_id,owner_id[0].owner_id]);

       await database.connectDatabase(`
        UPDATE owner o
        JOIN (
          SELECT owner_id, AVG(rating) AS avg_rating
          FROM feedback
          GROUP BY owner_id
        ) f ON o.id = f.owner_id
        SET o.rating = f.avg_rating
      `);
       return res.status(200).json({
        success: true,
        message: 'Đã gửi feedback !',
      });


  }catch(err){
    console.error('Lỗi Cancel BookingEdi:', err);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi trong quá trình gửi đánh giá '
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
   console.log(req.body)
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
    const status = req.params.status;
    const price=req.params.price;
    const creat_at=getVietnamDateTime();
    const user_id=req.params.user_id
    if(status=="top_up"){
      await database.connectDatabase(`INSERT INTO transaction (
     amount,
     created_date,
      method,
      type,
      user_id
       ) VALUES (?, ?, ?, ?, ?)`,[price,creat_at,"BANKING",status,user_id])

       await database.connectDatabase('update customer set balance =balance + ? where user_id=?',[price,user_id])
    }
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