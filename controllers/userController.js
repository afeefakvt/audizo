const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const util = require('../utils/emailUtils')
const Otp = require('../models/otpModel');
const Product = require('../models/productModel')
const Category = require("../models/categoryModel")
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();


const loadHome = async (req, res) => {
    try {
        const user = req.session.user_id;
        const productData = await Product.find({ isListed: false }).populate({
            path: "categoryId",
            match: { isBlocked: false }
        })

        const categoryData = await Category.find({ isBlocked: false })
        if (!productData) {
            return res.render("home", { productData: [], user });
        }
        res.render('home', { productData, user, categoryData });
    } catch (error) {
        console.log(error.message);
    }
}


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async (req, res) => {
    try {
        res.render('registration');
    } catch (error) {
        console.log(error.message);
    }
}
const insertUser = async (req, res) => {
    try {
        console.log(process.env.NODE_MAILER_EMAIL)
        const { email, password, name, mobile } = req.body

        //check if email already exists in the database
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render("registration", { message: "Email already exists,please use another email address" })
        }
        const spassword = await securePassword(password);
        const user = new User({
            name,
            email,
            mobile,
            password: spassword,
            is_admin: false,
            is_blocked: false
        });


        const userData = await user.save();
        console.log(userData)
        req.session.user_id = userData._id;

        await util.mailSender(
            email,
            userData._id,
            `It seems you logging at audizo and trying to verify your Email.
            Here is the verification code.Please enter otp and verify Email`
        );

        res.redirect('/otp');


    } catch (error) {
        console.log(error)

    }
}
const renderOTP = (req, res) => {
    try {
        res.render('otp');
    } catch (error) {
        res.send(error.message)
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.session.user_id;

        // Find the latest OTP entry for the user
        const otpp = await Otp.findOne({ otp, userId }).sort({ createdAt: -1 });
        console.log("otpp : ", otpp);

        if (otpp && otpp.userId.toString() === userId.toString()) {
            // Update the user's verification status
            await User.updateOne({ _id: userId }, { is_blocked: false, is_verified: true });
            req.session.isLogin = true;
            res.json({ success: true, message: 'OTP verified successfully.' });
        } else {
            res.json({ success: false, message: 'Invalid OTP. Please try again.' });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}


// const verifyOTP = async (req, res) => {
//     try {
//         const {otp} = req.body
//         const userId = req.session.user_id;
//         console.log(req.session.user_id)
//         // console.log(req.body.otp)
//         // res.json({message:req.body.otp})
//         const otpp = await Otp.findOne({ otp ,userId }).sort({ createdAt: -1 })
//         console.log("otpp : ", otpp);
//         if (otpp?.userId) {
//             await User.updateOne({ _id: userId ,is_blocked:false})
//                         res.json({ success: true, message: 'OTP verified successfully.' });

//         } else {
//             console.log("otp render");
//             res.json({ success: false, message: 'Invalid OTP. Please try again.' });

//             // return res.render('otp', { message: "invalid otp" });
//             // return res.redirect('otp');
//         }
//     } catch (error) {
//         console.log(error.message)
//         res.status(500).json({ success: false, message: 'Internal Server Error' });

//     }
// }

const resendOtp = async (req, res) => {

    try {

        const userId = req.session.user_id; // Assume the user ID is stored in session
        const user = await User.findById(userId); // Find the user by ID
        if (user) {
            // const newOtp = Math.floor(100000 + Math.random() * 900000); // Generate a new 6-digit OTP

            // await Otp.create({ otp: newOtp, userId: userId });
            await util.mailSender(user.email, user._id, 'Your new OTP is:');
            res.json({ success: true, message: 'OTP resent successfully.' });
        } else {
            res.json({ success: false, message: 'User not found.' });
        }
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ success: false, message: 'Internal Server Error' });

    }
}

//login
const loginLoad = async (req, res) => {
    try {
        const user = req.session.user_id
        res.render('login', { user });
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);

            if (passwordMatch) {
                if (userData.is_blocked == false) {
                    req.session.user_id = userData._id;
                    req.session.isLogin = true;
                    res.redirect("/");
                } else {
                    res.render('login', { message: "User blocked" });
                }

            } else {
                res.render("login", { message: "Wrong Password" });
            }
        } else {
            res.render("login", { message: "No user found" });
        }
    } catch (error) {
        res.send(error.message);
    }
};


// passport.use(
//   new GoogleStrategy({
//     clientID:process.env.ClientId,
//     clientSecret: process.env.ClientSecret,
//     callbackURL: 'http://localhost:1000/auth/google/callback',
//     passReqToCallback: true,
//   },
//    async(accessToken, refreshToken, profile, done) => {
//     // Check if the user already exists in our database
//     // if (!profile) {
//     //     return done(new Error('No profile returned by Google'));
//     //   }
//       done(null, profile);
//     }
//   )
// );
// passport.serializeUser((user, done) => {
//     done(null,user );
//   });

//   passport.deserializeUser((id, done) => {
//     User.findById(id, (err, user) => {
//       done(err, user);
//     });
//   });




// const googleSuccess = async (req, res, next) => {
//     try {
//       let userData = await User.findOne({ Email: req.user.emails[0].value });
//       if (!userData) {
//         userData = new User({
//           Name: req.user.displayName,
//           Email: req.user.emails[0].value,
//         });
//         await userData.save();
//       }
//       req.session.user_id = userData._id;
//       res.redirect("/home");
//     } catch (error) {
//       next(error);
//     }
//   };



const loadShop = async (req, res) => {
    try {
        const product = await Product.find({ isListed: false });
        console.log('product', product)

        return res.render('shop', { product });


    } catch (error) {
        console.log(error.message)
    }

}

const productDetail = async (req, res) => {
    try {
        const id = req.params.id;

        // Fetch product details
        const details = await Product.findById(id);
        if (!details) {
            console.log("Product not found");
            return res.status(404).send("Product not found");
        }
        // Fetch related products based on the category
        const relatedProducts = await Product.find({
            categoryId: details.categoryId,
            _id: { $ne: id },
            isListed: { $ne: true } // assuming isListed should be true to show listed products
        }).limit(4);
        return res.render('productDetail', {
            details: details,
            relatedProducts: relatedProducts
        });

    } catch (error) {
        console.error("Error fetching product details:", error.message);
        res.status(500).send("Server Error");
    }
};
//logout

const logoutLoad = async (req, res) => {
    try {
        delete req.session.user_id;
        delete req.session.isLogin;
        res.redirect("/");
    } catch (error) {
        console.log(error.message)

    }
};



module.exports = {

    loadHome,
    loadRegister,
    insertUser,
    renderOTP,
    verifyOTP,
    resendOtp,
    loginLoad,
    verifyLogin,
    // googleSuccess,
    loadShop,
    productDetail,
    logoutLoad,

}