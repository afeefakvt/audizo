const express=require("express");
const user_route=express();
const userController=require("../controllers/userController");
const cartController=require("../controllers/cartController");
const orderController=require("../controllers/orderController")
const wishlistController=require("../controllers/wishlistController");
const couponController=require("../controllers/couponController");
const passport = require("passport");
const multer=require("multer");
const config=require("../config/config");
const auth=require("../middleware/auth");
user_route.use(passport.initialize())
user_route.use(passport.session())
const path = require('path');
 


user_route.set('view engine','ejs');
user_route.set('views','./views/users');

user_route.use(express.json());
user_route.use(express.urlencoded({extended:true}));

//google authentication
user_route.get('/auth/google', passport.authenticate('google', {
    scope: ['email', 'profile']
  }))
  user_route.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/auth/google/googleSuccess',
    failureRedirect: '/login'
  }))
user_route.get("/auth/google/googleSuccess",userController.googleSuccess)


user_route.get('/',auth.authMiddleware,auth.is_blocked,userController.loadHome);
// user_route.get('/home',auth.authMiddleware,auth.is_blocked,userController.loadHome)
user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.isLogout,userController.renderOTP);
user_route.post('/otp',userController.verifyOTP);
user_route.post('/resendOtp',userController.resendOtp)

user_route.get('/login',auth.isLogout,userController.loginLoad);
user_route.post('/login',userController.verifyLogin);
user_route.get('/logout',auth.isLogin,userController.logoutLoad);
user_route.get('/shop',auth.authMiddleware,auth.is_blocked,userController.loadShop);
user_route.get('/productDetail/:id',auth.authMiddleware,auth.is_blocked,userController.productDetail);

//profile management
user_route.get('/profile',auth.isLogin,userController.loadProfile);
user_route.post('/profile/editProfile',userController.editProfile);
user_route.get('/profile/changePassword',auth.isLogin,userController.loadChangePassword);
user_route.post('/profile/changePassword',userController.changePassword);
user_route.get("/profile/myAddress",auth.isLogin,userController.loadMyAddress)
user_route.get("/profile/myAddress/addAddress",auth.isLogin,userController.loadAddAddress);
user_route.post("/profile/myAddress/addAddress",auth.isLogin,userController.addAddress);
user_route.get("/profile/myAddress/editAddress",auth.isLogin,userController.loadEditAddress);
user_route.post("/profile/myAddress/editAddress",auth.isLogin,userController.editAddress);
user_route.delete("/profile/myAddress",auth.isLogin,userController.deleteAddress);
user_route.get("/myOrders",auth.isLogin,orderController.myOrders);
user_route.get("/myOrders/orderDetails",auth.isLogin,orderController.orderDetails);
user_route.get("/forgotPassword",auth.isLogout,userController.loadForgotPassword);
user_route.post("/resetPassword",auth.isLogout,userController.resetPassword);
user_route.get("/newPassword",auth.isLogout,userController.newPasswordForm);
user_route.post("/newPassword",auth.isLogout,userController.newPassword);

//cart management
user_route.post("/addToCart",auth.isLogin,cartController.addToCart);
user_route.get("/cart",auth.isLogin,cartController.loadCart);
user_route.get("/decreaseCart", auth.isLogin, cartController.decreaseCart);
user_route.get("/increaseCart",auth.isLogin,cartController.increaseCart)
user_route.get("/removeFromCart",auth.isLogin,cartController.removeFromCart);

//checkout
user_route.get("/checkStock",auth.isLogin,cartController.checkStock);
user_route.get("/checkout",auth.isLogin,cartController.loadCheckout);
user_route.post("/checkout",auth.isLogin,cartController.addNewAddress)

//order management
user_route.post("/createOrder",auth.isLogin,orderController.createOrder);
user_route.get("/orderSuccess",auth.isLogin,orderController.orderSuccess);
user_route.get("/cancelOrder",auth.isLogin,orderController.cancelOrder);
user_route.get("/payNow",auth.isLogin,orderController.payNow);
user_route.get("/orderPlacing",auth.isLogin,orderController.orderPlacing);
user_route.get("/orderFailed",auth.isLogin,orderController.orderFailed)

//wishlist management
user_route.post("/addToWishlist",auth.isLogin,wishlistController.addToWishlist);
user_route.get('/wishlist',auth.isLogin,wishlistController.loadWishlist);
user_route.get("/removeFromWishlist",auth.isLogin,wishlistController.removeFromWishlist);


user_route.get("/checkCoupon",auth.isLogin,couponController.checkCoupon);
user_route.get("/getAvailableCoupons",auth.isLogin,couponController.getAvailableCoupons);

user_route.get("/referralLink",auth.isLogin,userController.loadReferralLink);

module.exports=user_route