const database = require('../../../Config/DataBase');
module.exports.confirmDeposit=async(req,res)=>{
    const car_id=req.params.id
    if (req.user.is_owner === 0) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
      }
    try{
        const check = await database.connectDatabase(`select * from car where id =? and owner_id=? `,[car_id,req.user.id]);
        if(check.length==0){
            return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
        }
        await database.connectDatabase('UPDATE booking set status="CONFIRMED" where car_id = ? and status ="PENDING_DEPOSIT"',[car_id]);

        const booking = await database.connectDatabase('select * from booking  where car_id = ? and status="CONFIRMED" ',[car_id])
        return res.status(200).json({ success: true, message: "Bạn đã xác nhận cọc xexe", booking:booking[0] });

    }catch(err){
        console.error('Lỗi editCar (transaction):', err);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi server khi confirm deposit ' });
    }
}
module.exports.ConfirmPayment=async(req,res)=>{
    const car_id=req.params.id
    if (req.user.is_owner === 0) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
      }
      try{
        const check = await database.connectDatabase(`select * from car where id =? and owner_id=? `,[car_id,req.user.id]);
        if(check.length==0){
            return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập" });
        }
        const checkbooking = await database.connectDatabase("select * from booking where car_id= ? and status ='PENDING_PAYMENT'",[car_id]);
        if(checkbooking.length==0){
          return res.status(403).json({ success: false, message: "Hệ thống chưa thanh toán " });
        }
        await database.connectDatabase('UPDATE booking set status="COMPLETED" where car_id = ? and status="PENDING_PAYMENT"',[car_id]);
        await database.connectDatabase('UPDATE car set status="available" where id = ? ',[car_id]);
      
        return res.status(200).json({ success: true, message: "Bạn đã xác nhận thanh toán xe ", bookingstatus:"COMPLETED" });

      }catch(err){
        console.error('Lỗi editCar (transaction):', err);
        return res.status(500).json({ success: false, message: err.message || 'Lỗi server khi confirm payment ' });
      }
}