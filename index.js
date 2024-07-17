const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/ecommerce1");
require('dotenv').config();
const express = require("express");
const app=express();
const session = require("express-session");
const nocache = require("nocache");
const path = require("path");
const passport = require("passport")

app.set('view engine','ejs');
app.set('views','./views');

app.use(session({
    secret:process.env.SESSIONSECRET,
    resave:false,
    saveUninitialized:true,
}));
    
app.use(passport.initialize())
app.use(passport.session())

app.use("/",nocache());
app.use("/static",express.static(path.join(__dirname,"public")));


//for user routes
const userRoute=require('./routes/userRoute');
app.use('/',userRoute);


 //for admin routes
 const adminRoute=require('./routes/adminRoute');
 app.use('/admin',adminRoute);

app.get("*",(req,res)=>{
    res.status(404).render("error")
})
 
app.listen(1000,()=>{
    console.log("server is running at http://localhost:1000")
});



