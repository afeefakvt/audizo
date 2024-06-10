const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/ecommerce1");
require('dotenv').config();
const cookieSession = require("cookie-session");
const express = require("express");
const app=express();
const session = require("express-session");
const nocache = require("nocache");
const path = require("path");
const cors = require("cors")
const passport = require("passport")
// const { v4: uuidv4 } = require("uuid");
// const authRoute = require("./routes/auth")


app.use(session({
    secret:process.env.sessionSecret,
    resave:false,
    saveUninitialized:true}));
    
app.use(passport.initialize())
app.use(passport.session())
    
// app.use(
//     cookieSession({
//         name:"session",
//         keys:["somesessionkey"],
//         maxAge:24 * 60 * 60 * 100,
//     })
// );

// app.use(passport.initialize());
// app.use(passport.session());   

app.use(
    cors({
        origin:"http://localhost:1000",
    })
)

// app.use("/auth",authRoute);



app.use("/",nocache());


app.use("/static",express.static(path.join(__dirname,"public")));


//for user routes
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);


 //for admin routes
 const adminRoute=require('./routes/adminRoute');
 app.use('/admin',adminRoute);


 
app.listen(1000,()=>{
    console.log("server is running at http://localhost:1000")
});



