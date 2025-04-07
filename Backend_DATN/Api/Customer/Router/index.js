const User_Router= require("./User.router");
module.exports = (app)=>{
    const version="/api/v1";
   
    app.use(version+'/register',User_Router);
   
}
