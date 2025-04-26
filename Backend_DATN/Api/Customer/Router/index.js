const User_Router= require("./User.router");
const Home_roter=require("./Home.router")
const Profile_router=require('./Profile.router')
const search_car_router=require('./SearchCar.router')
module.exports = (app)=>{
    const version="/api/v1";
    app.use(version,User_Router);
    app.use(version,Home_roter);
    app.use(version,Profile_router);
    app.use(version,search_car_router);
}
