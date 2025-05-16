const express = require('express');

const router = express.Router();
const Feedback_controller= require('../Controller/Feeback.controller')
const auth= require('../../../middleware/auth.middleware');
router.get('/owner/feeback',auth.AuthUser, Feedback_controller.feedback);
module.exports=router;