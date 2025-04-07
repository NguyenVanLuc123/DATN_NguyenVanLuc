const express = require('express');

const router = express.Router();
const FormRegisterValidation= require("../../../validation/Customers/FormRegister.validation")
const Usercontroller = require('../Controller/Users.Controller')
router.post('/',FormRegisterValidation.register, Usercontroller.register);

module.exports=router;