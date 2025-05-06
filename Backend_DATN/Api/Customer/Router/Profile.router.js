const express = require('express');
const multer = require('multer')


const uploadCloud= require("../../../middleware/UploadOnCloud_middlewares")

const upload = multer({ storage: multer.memoryStorage() })
const router = express.Router();
const profile_controller= require('../Controller/Profile.controller')
const check_Form=require('../../../validation/Customers/FormRegister.validation')
const auth= require('../../../middleware/auth.middleware');
router.get('/customer/profile',auth.AuthUser, profile_controller.getprofile);
router.put('/customer/profile',auth.AuthUser,upload.fields([
    { name: 'drivingLicense', maxCount: 1 }
  ]),uploadCloud.upload,check_Form.checkFormProfile,profile_controller.postprofile)
router.put('/customer/changepassword',auth.AuthUser,profile_controller.changePassword)
module.exports=router;