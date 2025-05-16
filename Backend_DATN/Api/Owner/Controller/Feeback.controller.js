const database = require('../../../Config/DataBase');

module.exports.feedback = async (req, res) => {
  try {
    const car_id_result = req.user.is_owner
      ? await database.connectDatabase("SELECT id FROM car WHERE owner_id = ?", [req.user.id])
      : await database.connectDatabase("SELECT id FROM car WHERE 1 = ?", [1]);

    const carIds = car_id_result.map(row => row.id);
    if (!carIds.length) return res.status(200).json({ success: true, message: 'danh sach feed back', data: [] });

    const carPlaceholders = carIds.map(() => '?').join(',');

    const feedbacks = await database.connectDatabase(
      `SELECT * FROM feedback WHERE car_id IN (${carPlaceholders})`,
      carIds
    );

    const cars = await database.connectDatabase(
      `SELECT * FROM car WHERE id IN (${carPlaceholders})`,
      carIds
    );
    const carMap = new Map(cars.map(car => [car.id, car]));

    const customerIds = [...new Set(feedbacks.map(fb => fb.customer_id))];
    const custPlaceholders = customerIds.map(() => '?').join(',');
    const customers = await database.connectDatabase(
      `SELECT * FROM customer WHERE id IN (${custPlaceholders})`,
      customerIds
    );
    const custMap = new Map(customers.map(cu => [cu.id, cu]));

    const feedbackWithDetails = feedbacks.map(fb => ({
      ...fb,
      car: carMap.get(fb.car_id) || null,
      customer: custMap.get(fb.customer_id) || null
    }));

    res.status(200).json({ success: true, message: 'danh sach feed back', data: feedbackWithDetails });
  } catch (err) {
    console.error('Lỗi feedback : ', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi server khi get feedback' });
  }
};
