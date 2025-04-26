const database = require('../../../Config/DataBase');


module.exports.index=async(req,res)=>{
    try {
        const user=req.user;
        const query = 'SELECT is_owner  FROM user WHERE id = ?';
        const userResult = await database.connectDatabase(query, [user.user_id]);
        return res.status(200).json({success: true, message: 'xác thực người dùng thành công',data:user,account:userResult[0]})
       
    } catch (error) {
        console.log(error)
        return res.status(401).json({ success: false, message:"loi truy van" });
    }
}
