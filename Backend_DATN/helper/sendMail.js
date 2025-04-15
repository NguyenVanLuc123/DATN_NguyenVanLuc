const nodemailer= require('nodemailer')

module.exports.sendmail=(email,subject,html)=>{
    var transporter = nodemailer.createTransport({
       service:'gmail',
        auth: {
          user: process.env.Email_user,
          pass:process.env.Email_Pass
        },
        
      });
      
      var mailOptions = {
        from: 'alaluclun11032003@gmail.com',
        to: email,
        subject: subject,
        html: html
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
}