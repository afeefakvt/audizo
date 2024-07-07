const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const util = require('../utils/emailUtils');
const Otp = require('../models/otpModel');
const Product = require('../models/productModel');
const Category = require("../models/categoryModel");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const passport = require("passport");
const { is_blocked } = require('../middleware/auth');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();



const loadHome = async (req, res) => {
    try {
        // const user = req.session.user_id;

        const userData = await User.findOne({ _id: req.session.user_id });
        const productData = await Product.find({ isListed: false }).populate({
            path: "categoryId",
            match: { isBlocked: false }
        })

        const categoryData = await Category.find({ isBlocked: false })
        if (!productData) {
            return res.render("home", { productData: [], user });
        }
        res.render('home', { user: userData, productData, categoryData });
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
        const existingUser = await User.findOne({ email, is_verified: true });
        if (existingUser) {
            return res.status(400).render("registration", { message: "Email already exists,please use another email address" })
        }
        const spassword = await securePassword(password);
        const user = new User({
            name,
            email,
            mobile,
            password: spassword,
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

            //  remove the OTP after successful verification
            await Otp.deleteOne({ _id: otpp._id });

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


const resendOtp = async (req, res) => {
    try {
        const userId = req.session.user_id; // Assume the user ID is stored in session
        const user = await User.findById(userId); // Find the user by ID
        if (user) {
            // Invalidate old OTPs
            await Otp.deleteMany({ userId });

            // Generate a new 6-digit OTP
            const newOtp = Math.floor(100000 + Math.random() * 900000);

            // Save the new OTP to the database
            await Otp.create({ otp: newOtp, userId });

            //send the new otp via email
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

        const userData = await User.findOne({ email: email, is_verified: true, is_googleAuthenticated: false });

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


passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
        async (accessToken, refreshToken, profile, done) => {
            return done(null, profile);
        }
    )
);
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});


const googleSuccess = async (req, res, next) => {
    try {
        let userData = await User.findOne({ email: req.user.emails[0].value });
        if (!userData) {
            userData = new User({
                name: req.user.displayName,
                email: req.user.emails[0].value,
                is_verified: true,
                is_googleAuthenticated: true
            });
            await userData.save();
        }
        else {
            // If the user exists but is_verified is false, update it
            if (!userData.is_verified) {
                userData.is_verified = true;
                await userData.save();
            }
        }
        req.session.user_id = userData._id;
        req.session.isLogin = true;
        req.session.save((err) => {
            if (err) {
                console.log(err);
                return next(err);
            }
            res.redirect("/");
        });
    } catch (error) {
        next(error);
    }
};




const loadShop = async (req, res) => {
    try {
        const product = await Product.find({ isListed: false });
        const category = await Category.find({ isBlocked: false })

        return res.render('shop', { product: product, category: category,sortOption:"" });


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
            isListed: false// assuming isListed should be true to show listed products
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

const loadProfile = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })

        res.render("profile", { user: userData })

    } catch (error) {
        console.log(error.message)
    }
}

const editProfile = async (req, res) => {
    try {
        const { name, mobile } = req.body;
        // Fetch the user from the database using the session user ID
        const user = await User.findOne({ _id: req.session.user_id });
        console.log('User before update:', user);

        // Update user details in the database
        user.name = name,
            user.mobile = mobile,

            await user.save();
        res.redirect('/profile');

        console.log('User after update:', user);

    } catch (error) {
        console.log(error.message)
    }

}

const loadChangePassword = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })

        res.render("changePassword", { user: userData })

    } catch (error) {
        console.log(error.message)
    }

}
const changePassword = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        if (userData) {
            const passwordMatch = await bcrypt.compare(req.body.oldPassword, userData.password)
            if (passwordMatch) {
                const spassword = await securePassword(req.body.newPassword)
                userData.password = spassword
                await userData.save();
                res.redirect('/profile');

            }
        }

    } catch (error) {
        console.log(error.message)
    }
}

const loadMyAddress = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        const address = await Address.findOne({ userId: userData._id });

        res.render("myAddress", { user: userData, addresses: address })
        console.log(userData, "aaaaaaaaaaa")
        console.log(address, "sssssss")
    } catch (error) {
        console.log(error.message)
    }
}
const loadAddAddress = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });



        res.render("addAddress", { user: userData })


    } catch (error) {
        console.log(error.message)
    }
}
const addAddress = async (req, res, next) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        let address = await Address.findOne({ userId: userData._id });
        if (!address) {
            address = await new Address({
                userId: userData._id,
                address: [],
            })
        }
        const { name, mobile, pincode, house, locality, city, state, } = req.body;
        address.address.push({
            name: name,
            mobile: mobile,
            pincode: pincode,
            house: house,
            locality: locality,
            city: city,
            state: state
        })
        await address.save();

        res.redirect("/profile/myAddress")

    } catch (error) {
        next(error)
    }
}
const loadEditAddress = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        const index = req.query.index;
        const addressData = await Address.findOne({ userId: userData._id });
        const address = addressData.address[index];
        res.render("editAddress", { user: userData, address: address, index: index })

    } catch (error) {
        console.log(error.message)
    }
}
const editAddress = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        const index = req.query.index
        const addressData = await Address.findOne({ userId: userData._id })
        const { name, mobile, pincode, house, locality, city, state } = req.body
        addressData.address[index] = {
            name: name,
            mobile: mobile,
            pincode: pincode,
            house: house,
            locality: locality,
            city: city,
            state: state
        }
        await addressData.save();
        res.redirect("/profile/myAddress")

    } catch (error) {
        console.log(error.message)
    }

}
const deleteAddress = async (req, res, next) => {
    try {
        const address = await Address.findOne({ userId: req.session.user_id });
        const index = req.query.index;
        await address.address.splice(index, 1);
        await address.save()
        res.json({ success: true });


    } catch (error) {
        next(error);
    }
}

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
    googleSuccess,
    loadShop,
    productDetail,
    logoutLoad,
    loadProfile,
    editProfile,
    loadChangePassword,
    changePassword,
    loadMyAddress,
    loadAddAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    

}