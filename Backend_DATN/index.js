const express= require("express");
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const body_parser=require("body-parser")
const cookieParser = require('cookie-parser');
const Customers_Router=require("./Api/Customer/Router/index")
const Owner_Router=require("./Api/Owner/Router/index")
require("dotenv").config();
const bookingRealTime= require('./socket.io/BookingRealTime');
const app= express();

const port=process.env.port;

// Hoặc cấu hình crosscr
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001'], // Có thể thêm nhiều domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS',"PATCH"],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // cache CORS preflight request trong 24h
}));
//socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3001'], // Có thể thêm nhiều domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS',"PATCH"],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // cache CORS preflight request trong 24h
  },
});

bookingRealTime.Booking(io);
//body_parser
app.use(body_parser.json());
//body_parser

//cookie_parser
app.use(cookieParser());
//cookie_parser
Customers_Router(app);
Owner_Router(app);
server.listen(port,()=>{
    console.log(`App listening on port ${port} `);

})