const express = require('express');
const multer = require('multer')


const uploadCloud= require("../../../middleware/UploadOnCloud_middlewares")

const upload = multer({ storage: multer.memoryStorage() })
const router = express.Router();
const Booking_controller= require('../Controller/Booking.controller')
const auth= require('../../../middleware/auth.middleware');
router.post('/customer/booking',auth.AuthUser,upload.fields([
    { name: 'drivingLicense', maxCount: 1 }
  ]),uploadCloud.upload, Booking_controller.BookingPost);
router.post("/vnpay/create",auth.AuthUser,Booking_controller.create_vnpay_payment);
router.get("/vnpay/return/:status/:user_id/:price",Booking_controller.confirm_vnpay_payment);
router.get("/customer/listbooking",auth.AuthUser,Booking_controller.listBooking);
router.get("/customer/booking/:id",auth.AuthUser,Booking_controller.bookingDetail)
router.put("/customer/booking/:id",auth.AuthUser,upload.fields([
  { name: 'drivingLicense', maxCount: 1 }
]),uploadCloud.upload,Booking_controller.bookingDetailput)
router.put('/customer/booking/cancel/:id',auth.AuthUser,Booking_controller.BookingCancel)
router.put('/customer/booking/In_progress/:id',auth.AuthUser,Booking_controller.In_progress)
router.get('/customer/booking/Totalpayment/:id',auth.AuthUser,Booking_controller.Totalpayment)
router.put('/customer/booking/ReturnCar/:id/:total',auth.AuthUser,Booking_controller.ReturnCar)
router.post('/customer/booking/Feedback/:car_id',auth.AuthUser,Booking_controller.Feedback)
module.exports=router;