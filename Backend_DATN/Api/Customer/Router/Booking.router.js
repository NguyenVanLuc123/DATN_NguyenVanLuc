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
router.get("/vnpay/return/:id",Booking_controller.confirm_vnpay_payment);
router.get("/customer/listbooking",auth.AuthUser,Booking_controller.listBooking);
router.get("/customer/booking/:id",auth.AuthUser,Booking_controller.bookingDetail)
router.put("/customer/booking/:id",auth.AuthUser,upload.fields([
  { name: 'drivingLicense', maxCount: 1 }
]),uploadCloud.upload,Booking_controller.bookingDetailput)
router.put('/customer/booking/cancel/:id',auth.AuthUser,Booking_controller.BookingCancel)
module.exports=router;