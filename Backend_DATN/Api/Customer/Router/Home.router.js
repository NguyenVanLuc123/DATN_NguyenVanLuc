const express = require('express');

const router = express.Router();
const home_controller= require('../Controller/Home.controller')
const auth= require('../../../middleware/auth.middleware');
router.get('/customer/home',auth.AuthUser, home_controller.index);


module.exports=router;