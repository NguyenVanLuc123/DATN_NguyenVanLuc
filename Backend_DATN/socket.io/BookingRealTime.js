const database = require('../Config/DataBase');
module.exports.Booking=async(io)=>{
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
      
      socket.on('CLIENT_BOOKING',async (data)=>{
        socket.broadcast.emit("SERVER_BOOKING",{BookingStatus:"PENDING_DEPOSIT",car_id:data})
      })

      socket.on('CONFIRM_DEPOSIT',async(data)=>{
        socket.broadcast.emit("SERVER_CONFIRM_DEPOSIT",{BookingStatus:"CONFIRMED",car_id:data})
      })
     
      socket.on('CLINET_CANCEL_CAR',async(data)=>{
         socket.broadcast.emit("SERVER_CANCEL_CAR",{BookingStatus:"STOPPED",car_id:data})
      })
      
     socket.on('CLINET_CONFIRM_PICK_UP',async(data)=>{
       socket.broadcast.emit("SERVER_CONFIRM_PICK_UP",{BookingStatus:"IN_PROGRESS",car_id:data})
     })

     socket.on('CLINET_RETURN_CAR',async(data)=>{
       socket.broadcast.emit("SERVER_RETURN_CAR",{BookingStatus:"PENDING_PAYMENT",car_id:data})
     })

     socket.on("CLIENT_CONFIRM_PAYMENT",async(data)=>{
      socket.broadcast.emit("SERVER_CONFIRM_PAYMENT",{BookingStatus:"COMPLETED",car_id:data})
     })
      
      });
}