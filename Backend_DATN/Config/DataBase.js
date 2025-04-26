// src/Config/DataBase.js
const mysql = require('mysql2/promise');
require('dotenv').config(); // Đảm bảo rằng biến môi trường được tải

const pool = mysql.createPool({
    host: 'localhost',
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    waitForConnections: true,
    connectionLimit: 10, // Số lượng kết nối tối đa
    queueLimit: 0
});

// Kiểm tra kết nối ngay khi module được load
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`✅ Đã kết nối thành công đến MySQL tại cổng 3306`);
        connection.release();
    } catch (error) {
        console.error('❌ Không thể kết nối đến MySQL:', error.message);
    }
})();

// Hàm để thực hiện truy vấn
const connectDatabase = async (query, values) => {
    const [rows] = await pool.execute(query, values);
    return rows;
};

module.exports = {
    connectDatabase
};
