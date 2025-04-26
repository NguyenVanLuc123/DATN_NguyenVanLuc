const database = require('../../../Config/DataBase');

module.exports.getCar = async (req, res) => {
    const user = req.user;
    try {
        if (user.is_owner === 0) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền truy cập"
            });
        }

        // Truy vấn để lấy danh sách xe của chủ sở hữu
        const query = 'SELECT * FROM car WHERE owner_id = ?';
        const ListCarResult = await database.connectDatabase(query, [user.id]);

        // Truy vấn để lấy danh sách booking với trạng thái PENDING_PAYMENT hoặc PENDING_DEPOSIT
        const bookingQuery = 'SELECT car_id, status FROM booking WHERE status IN (?, ?)';
        const listBooking = await database.connectDatabase(bookingQuery, ['PENDING_PAYMENT', 'PENDING_DEPOSIT']);
        
        // Tạo một đối tượng để dễ dàng tra cứu trạng thái booking theo car_id
        const bookingMap = {};
        listBooking.forEach(booking => {
            bookingMap[booking.car_id] = booking.status;
        });

        // Thêm trường booking vào ListCarResult nếu có
        ListCarResult.forEach(car => {
            if (bookingMap[car.id]) {
                car.booking = bookingMap[car.id]; // Thêm trường booking với giá trị là status của booking
            }
        });

        res.status(200).json({
            success: true,
            message: "Danh sách xe",
            data: ListCarResult,
            user: user
        });
    } catch (error) {
        console.error('Lỗi getCar:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật getCar'
        });
    }
};