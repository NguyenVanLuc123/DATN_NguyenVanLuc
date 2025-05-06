// src/Api/Owner/Controller/Car.controller.js
const database = require('../../../Config/DataBase');

module.exports.getCar = async (req, res) => {
  const user = req.user;
  try {
    if (user.is_owner === 0) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
    }

    // Truy vấn để lấy danh sách xe của chủ sở hữu
    const query = 'SELECT * FROM car WHERE owner_id = ?';
    const ListCarResult = await database.connectDatabase(query, [user.id]);

    // Truy vấn booking PENDING
    const bookingQuery = 'SELECT car_id, status FROM booking WHERE status IN (?, ?)';
    const listBooking = await database.connectDatabase(bookingQuery, ['PENDING_PAYMENT', 'PENDING_DEPOSIT']);

    // Map trạng thái booking
    const bookingMap = {};
    listBooking.forEach(b => { bookingMap[b.car_id] = b.status; });
    ListCarResult.forEach(car => {
      if (bookingMap[car.id]) car.booking = bookingMap[car.id];
    });

    res.status(200).json({ success: true, message: "Danh sách xe", data: ListCarResult, user });
  } catch (error) {
    console.error('Lỗi getCar:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách xe' });
  }
};

module.exports.editCar = async (req, res) => {
  // Sử dụng transaction để cập nhật 3 bảng: car, car_additional_function, car_term_of_use
  const pool = database.pool; // pool của mysql2
  const conn = await pool.getConnection();
  console.log(req.user)
  try {
    const {
       license_plate, brand, MFG, transmission_type, fuel_type,
      color, model, seat, mileage, fuel_consumption, description,
      base_price, required_deposit, status, location,
      additional_function_id, term_of_use_id, front_img, back_img,
      left_img, right_img
    } = req.body;
    const car_id = req.params.id;
    const name = brand + " " + model;
    await conn.beginTransaction();

    // Khóa bản ghi cũ
    const [rows] = await conn.query('SELECT * FROM car WHERE id = ? FOR UPDATE', [car_id]);
    if (rows.length === 0) throw new Error('Xe không tồn tại');
    const old = rows[0];

    // Ảnh cuối cùng nếu không gửi mới
    const final_front_img = front_img?.trim() ? front_img : old.front_img;
    const final_back_img  = back_img?.trim()  ? back_img  : old.back_img;
    const final_left_img  = left_img?.trim()  ? left_img  : old.left_img;
    const final_right_img = right_img?.trim() ? right_img : old.right_img;

    if(status==='busy'){
      res.status(422).json({ success: false, message:'Bạn không tự cập nhật về busy được' });
    }
    // 1) UPDATE car
    const updateCarSql = `
      UPDATE car SET
        name = ?, license_plate = ?, brand = ?, color = ?, seat = ?, MFG = ?,
        mileage = ?, status = ?, price = ?, model = ?, fuel_type = ?,
        transmission_type = ?, description = ?, front_img = ?, back_img = ?,
        left_img = ?, right_img = ?, location = ?, required_deposit = ?,
        fuel_consumption = ?
      WHERE id = ?
    `;
    await conn.query(updateCarSql, [
      name, license_plate, brand, color, seat, MFG,
      mileage, status, base_price, model, fuel_type,
      transmission_type, description,
      final_front_img, final_back_img, final_left_img, final_right_img,
      location, required_deposit, fuel_consumption, car_id
    ]);

    // 2) UPDATE car_additional_function
    await conn.query(
      'UPDATE car_additional_function SET additional_function_id = ? WHERE car_id = ?',
      [additional_function_id, car_id]
    );

    // 3) UPDATE car_term_of_use
    await conn.query(
      'UPDATE car_term_of_use SET term_of_use_id = ? WHERE car_id = ?',
      [term_of_use_id, car_id]
    );

    // Commit
    await conn.commit();
    res.status(200).json({ success: true, message: 'Cập nhật xe thành công' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi editCar (transaction):', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi server khi cập nhật Car' });
  } finally {
    conn.release();
  }
};
module.exports.CreateCar = async (req, res) => {
  const user = req.user;
  if (user.is_owner === 0) {
    return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
  }

  const {
    license_plate, brand, MFG, transmission_type, fuel_type,
    color, model, seat, mileage, fuel_consumption, description,
    base_price, required_deposit, status, location,
    additional_function_id, term_of_use_id,
    front_img, back_img, left_img, right_img
  } = req.body;

  const name = `${brand} ${model}`;
  const final_front_img  = front_img?.trim()  || "";
  const final_back_img   = back_img?.trim()   || "";
  const final_left_img   = left_img?.trim()   || "";
  const final_right_img  = right_img?.trim()  || "";

  const pool = database.pool;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1) INSERT INTO car
    const insertCarSql = `
  INSERT INTO car (
    name, license_plate, brand, color, seat, MFG,
    mileage, status, price, model, fuel_type,
    transmission_type, description, front_img, back_img,
    left_img, right_img, location, required_deposit,
    fuel_consumption, rides, rating, owner_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const [insertResult] = await conn.query(insertCarSql, [
  name, license_plate, brand, color, seat, MFG,
  mileage, status, base_price, model, fuel_type,
  transmission_type, description,
  final_front_img, final_back_img, final_left_img, final_right_img,
  location, required_deposit, fuel_consumption,
  0, 5, user.id // rides = 0, rating = 5, owner_id = user.id
]);

    const car_id = insertResult.insertId;

    // 2) INSERT INTO car_additional_function (nếu có)
    if (additional_function_id) {
      await conn.query(
        'INSERT INTO car_additional_function (car_id, additional_function_id) VALUES (?, ?)',
        [car_id, additional_function_id]
      );
    }

    // 3) INSERT INTO car_term_of_use (nếu có)
    if (term_of_use_id) {
      await conn.query(
        'INSERT INTO car_term_of_use (car_id, term_of_use_id) VALUES (?, ?)',
        [car_id, term_of_use_id]
      );
    }

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'Tạo xe thành công',
      data: { car_id }
    });
  } catch (error) {
    await conn.rollback();
    console.error('Lỗi CreateCar (transaction):', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi tạo xe' });
  } finally {
    conn.release();
  }
};

