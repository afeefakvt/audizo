const express=require("express");
const user_route=express();
const userController=require("../controllers/userController");
const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer=require("multer");
// const path=require("path")
const config=require("../config/config");
const auth=require("../middleware/auth");

const path = require('path')
require('../utils/gpassport')
 


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));


user_route.get('/auth/google', passport.authenticate('google', {
    scope: ['email', 'profile']
  }))
  user_route.use(passport.initialize())
  user_route.use(passport.session())
  
  user_route.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/',
    failureRedirect: '/login'
  }))
// user_route.get('/',userController.landingPage)
// user_route.use(auth.checkBlocked);

user_route.get('/',auth.authMiddleware,auth.is_blocked,userController.loadHome);
user_route.get('/home',auth.authMiddleware,auth.is_blocked,userController.loadHome)
user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.isLogout,userController.renderOTP)
user_route.post('/otp',userController.verifyOTP);
user_route.post('/resendOtp',userController.resendOtp)

user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin);
user_route.get('/logout',auth.isLogin,userController.logoutLoad);

user_route.get('/shop',auth.authMiddleware,auth.is_blocked,userController.loadShop);
user_route.get('/productDetail/:id',auth.authMiddleware,auth.is_blocked,userController.productDetail);




module.exports=user_route