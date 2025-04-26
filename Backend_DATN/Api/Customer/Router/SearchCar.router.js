const express = require('express');

const router = express.Router();
const search_controller= require('../Controller/SearchCar.controller')
router.get('/customer/search_car', search_controller.getCar);
router.get('/customer/search_car/:id',search_controller.getCarByid)

module.exports=router;