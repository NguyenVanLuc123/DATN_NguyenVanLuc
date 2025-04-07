const express= require("express");
const body_parser=require("body-parser")
const databse=require('./Config/DataBase')
const Customers_Router=require("./Api/Customer/Router/index")
require("dotenv").config();
const app= express();
const cors = require('cors');
const port=process.env.port;
// Hoặc cấu hình crosscr
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'], // Có thể thêm nhiều domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // cache CORS preflight request trong 24h
}));
//body_parser
app.use(body_parser.json());
//body_parser
Customers_Router(app)
app.listen(port,()=>{
    console.log(`App listening on port ${port} `);

})