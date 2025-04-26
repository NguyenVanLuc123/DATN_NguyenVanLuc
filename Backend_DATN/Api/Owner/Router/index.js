const Car_Router= require("./Car.router");

module.exports = (app)=>{
    const version="/api/v1";
    app.use(version,Car_Router);

}
