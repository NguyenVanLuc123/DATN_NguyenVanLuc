const express = require('express');

const router = express.Router();
const Booking_controller= require('../Controller/Booking.controlle')
const auth= require('../../../middleware/auth.middleware');
router.put('/owner/booking/confirmDeposit/:id',auth.AuthUser, Booking_controller.confirmDeposit);
router.put('/owner/booking/ConfirmPayment/:id',auth.AuthUser, Booking_controller.ConfirmPayment);
module.exports=router;