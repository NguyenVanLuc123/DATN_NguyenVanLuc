const express = require('express');
const multer = require('multer')

const uploadCloud= require("../../../middleware/UploadOnCloud_middlewares")

const upload = multer({ storage: multer.memoryStorage() })
const router = express.Router();
const Car_controller= require('../Controller/Car.controller')
const auth= require('../../../middleware/auth.middleware');
router.get('/owner/cars',auth.AuthUser, Car_controller.getCar);
router.put('/owner/cars/edit/:id',auth.AuthUser,upload.fields([
  { name: 'front_img', maxCount: 1 },
  { name: 'left_img', maxCount: 1 },
  { name: 'back_img', maxCount: 1 },
  { name: 'right_img', maxCount: 1 }
]),uploadCloud.upload,Car_controller.editCar)
router.post('/owner/cars/create',auth.AuthUser,upload.fields([
  { name: 'front_img', maxCount: 1 },
  { name: 'left_img', maxCount: 1 },
  { name: 'back_img', maxCount: 1 },
  { name: 'right_img', maxCount: 1 }
]),uploadCloud.upload,Car_controller.CreateCar)
module.exports=router;