const express = require('express');

const router = express.Router();
const Car_controller= require('../Controller/Car.controller')
const auth= require('../../../middleware/auth.middleware');
router.get('/owner/cars',auth.AuthUser, Car_controller.getCar);


module.exports=router;