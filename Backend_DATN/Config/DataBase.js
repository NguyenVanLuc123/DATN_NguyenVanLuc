const mysql = require('mysql2');


module.exports.connectDatabase = async (QueryString, values) => {
  // Tạo một pool kết nối
  const pool = mysql.createPool({
    host: process.env.host,
    port: process.env.MYSQL_PORT,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    waitForConnections: true, 
    connectionLimit: 10,      
    queueLimit: 0            
  });

  // Kiểm tra kết nối
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Lỗi kết nối MySQL Pool:', err.stack);
      return;
    }
    console.log('Kết nối thành công với MySQL Pool, ID của kết nối:', connection.threadId);
    connection.release(); // Trả lại kết nối vào pool sau khi kiểm tra xong
  });

  // Trả về để sử dụng trong ứng dụng
  return await new Promise((resolve, reject) => {
    pool.query(QueryString, values, function (error, results) {
      if (error) return reject(error);
      resolve(results);
    });
  });
};
