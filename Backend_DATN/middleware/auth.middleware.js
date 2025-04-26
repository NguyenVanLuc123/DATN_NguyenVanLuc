const jwt = require('jsonwebtoken');
const database = require('../Config/DataBase');

module.exports.AuthUser = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        let userResult = [];

        if (decoded.is_owner == 0) {
            const query = 'SELECT * FROM customer WHERE user_id = ?';
            userResult = await database.connectDatabase(query, [decoded.userId]);
        } else {
            const query = 'SELECT * FROM owner WHERE user_id = ?';
            userResult = await database.connectDatabase(query, [decoded.userId]);
        }

        if (userResult.length > 0) {
            req.user = {
                ...userResult[0],
                is_owner: decoded.is_owner // Thêm luôn is_owner vào user
            };
          
            
            next();
        } else {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
};
