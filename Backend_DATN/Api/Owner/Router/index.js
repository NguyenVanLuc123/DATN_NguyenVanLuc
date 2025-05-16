const Car_Router= require("./Car.router");
const Booking_Router=require('./Booking.router');
const Feddback_router=require('./Feeback.router')
module.exports = (app)=>{
    const version="/api/v1";
    app.use(version,Car_Router);
    app.use(version,Booking_Router);
    app.use(version,Feddback_router);
}
