const database = require('../../../Config/DataBase');
const jwt = require('jsonwebtoken');

module.exports.getCar = async (req, res) => {
    const { city, district, ward } = req.query; // Lấy các tham số từ query
    const token = req.cookies.token;
    
    try {
        // Tạo truy vấn SQL để tìm kiếm xe
        let sql = `SELECT * FROM car WHERE status = ?`;
        const params = ['available']; // Khởi tạo với trạng thái 'available'

        // Thêm điều kiện cho city
        if (city) {
            sql += ` AND location LIKE ?`;
            params.push(`%${city}%`);
        }

        // Thêm điều kiện cho district
        if (district) {
            sql += ` AND location LIKE ?`;
            params.push(`%${district}%`);
        }

        // Thêm điều kiện cho ward
        if (ward) {
            sql += ` AND location LIKE ?`;
            params.push(`%${ward}%`);
        }

        // Thêm phần sắp xếp theo rating giảm dần
        sql += ` ORDER BY rating DESC`;

        if (Object.keys(req.query).length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No cars found',
                user: userResult
            });
        }

        // Thực thi truy vấn
        const results = await database.connectDatabase(sql, params);
        var userResult = [];
  
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
          if (decoded.is_owner == 0) {
              const query = 'SELECT * FROM customer WHERE user_id = ?';
              userResult = await database.connectDatabase(query, [decoded.userId]);
          } else {
              const query = 'SELECT * FROM owner WHERE user_id = ?';
              userResult = await database.connectDatabase(query, [decoded.userId]);
          }
      
          // Thêm is_owner vào userResult[0] nếu có user
          if (userResult.length > 0) {
              userResult[0].is_owner = decoded.is_owner;
          }
      }

        if (results.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Cars found',
                data: results,
                user: userResult
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'No cars found',
                user: userResult
            });
        }
    } catch (error) {
        console.error('Error during car search:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while searching for cars.',
        });
    }
};

module.exports.getCarByid=async(req,res)=>{
  const {id} = req.params; // Lấy các tham số từ query
  const token = req.cookies.token;

try {
  // Tạo truy vấn SQL để tìm kiếm xe
  let sql = `SELECT * FROM car WHERE status = ? and id =?`;
  const status="available"

 let sql_additonal = `SELECT * FROM car_additional_function WHERE  car_id =?`;

 let sql_team_of_user = `SELECT * FROM car_term_of_use WHERE  car_id =?`;


  // Thực thi truy vấn
  const results = await database.connectDatabase(sql, [status,id]);

  const results_additonal = await database.connectDatabase(sql_additonal, [id]);

  const results_team_of_use = await database.connectDatabase(sql_team_of_user, [id]);
  

  var userResult=[];

  if(token){
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
     
      if (decoded.is_owner==0) {
          const query = 'SELECT * FROM customer WHERE user_id = ?';

           userResult = await database.connectDatabase(query, [decoded.userId]);
           
      }
      else{
          const query = 'SELECT * FROM owner WHERE user_id = ?';
           userResult = await database.connectDatabase(query, [decoded.userId]);
         
      }
  }
  

  if (results.length > 0) {
    return res.status(200).json({
      success: true,
      message: 'Cars found',
      data: results,
      additonal:results_additonal,
      team_of_user:results_team_of_use,
      user:userResult
    });
  } else {
    return res.status(404).json({
      success: false,
      message: 'car does not exist',
      user:userResult
    });
  }
} catch (error) {
  console.error('Error during car search:', error);
  return res.status(500).json({
    success: false,
    message: 'An error occurred while searching for cars.',
  });
}
}