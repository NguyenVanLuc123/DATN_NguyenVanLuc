const express = require('express');

const router = express.Router();
const FormRegisterValidation= require("../../../validation/Customers/FormRegister.validation")
const Usercontroller = require('../Controller/Users.Controller')
const auth = require('../../../middleware/auth.middleware');

router.post('/register',FormRegisterValidation.register, Usercontroller.register);
router.post('/login',FormRegisterValidation.login,Usercontroller.login);
router.post('/forgotPassword',Usercontroller.forgotPassword);
router.post('/otp',Usercontroller.otpPassword);
router.patch('/changePassword',Usercontroller.ChangePassword);
router.get('/logout',auth.AuthUser,Usercontroller.logout);
router.get('/wallet',auth.AuthUser,Usercontroller.wallet);
router.post("/findTransction",auth.AuthUser,Usercontroller.findtransaction)
router.get('/with_draw/:price_with_draw',auth.AuthUser,Usercontroller.WithDraw)
module.exports=router;