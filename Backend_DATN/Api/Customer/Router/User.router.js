const express = require('express');

const router = express.Router();
const FormRegisterValidation= require("../../../validation/Customers/FormRegister.validation")
const Usercontroller = require('../Controller/Users.Controller')
router.post('/register',FormRegisterValidation.register, Usercontroller.register);
router.post('/login',FormRegisterValidation.login,Usercontroller.login)
module.exports=router;