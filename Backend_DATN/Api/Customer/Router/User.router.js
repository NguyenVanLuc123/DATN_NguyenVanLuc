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
router.get('/logout',auth.AuthUser,Usercontroller.logout)

module.exports=router;