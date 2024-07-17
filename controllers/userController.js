const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const util = require('../utils/emailUtils');
const Otp = require('../models/otpModel');
const Product = require('../models/productModel');
const Category = require("../models/categoryModel");
const Address = require("../models/addressModel");
const Wallet = require("../models/walletModel");
const mongoose = require('mongoose');
const crypto = require("crypto");
const ObjectId = mongoose.Types.ObjectId;
const passport = require("passport");
const { search } = require('../routes/userRoute');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require('dotenv').config();



const loadHome = async (req, res) => {
    try {
        const user = req.session.user_id;
        const userData = await User.findOne({ _id: req.session.user_id });
        const productData = await Product.find({ isListed: false }).populate({
            path: "categoryId",
            match: { isListed: false }
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
        const referralId = req.query.referralId
        console.log(referralId,"referrraal");
        res.render('registration',{ referralId:referralId?referralId:""});
    } catch (error) {
        console.log(error.message);
    }
}
const insertUser = async (req, res) => {

        try {
            const referralId=req.query.referralId
            console.log("Query Parameters:", referralId);
            const { email, password, name, mobile } = req.body;
    
            // Check if email already exists in the database
            const existingUser = await User.findOne({ email, is_verified: true });
            if (existingUser) {
                return res.status(400).render("registration", { message: "Email already exists, please use another email address" });
            }
    
            // Create and save new user
            const spassword = await securePassword(password);
            const user = new User({
                name,
                email,
                mobile,
                password: spassword,
                is_blocked: false
            });
          
           if(referralId){
            req.session.referral=referralId
           }
            const userData = await user.save();
            console.log(userData);
            req.session.user_id = userData._id;
    
            // Send verification email
            await util.mailSender(
                email,
                userData._id,
                `It seems you are logging in at Audizo and trying to verify your Email.
                Here is the verification code. Please enter OTP and verify your Email.`
            );
    
            res.redirect('/otp');
        } catch (error) {
            console.error(error.message);
            res.status(500).send('Internal Server Error');
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

            console.log("referrrraaal",req.session.referral);
             if (req.session.referral) {
                const referral = req.session.referral
                const user = await User.findOne({ referralId: referral })
                console.log(user,"userrrr find");
                if (user) {
                    console.log("user ind");
                    // wallet of user having the referral code
                    let wallet = await Wallet.findOne({ userId: user._id })
                    if (wallet) {
                         console.log("user wallet");
                        wallet.history.push({
                            amount: 100,
                            type: 'Credit',
                            newBalance:100
                        });
                        wallet.balance += Number(100);
                        await wallet.save();
    
                    } else {
                        console.log("wwwwaallettt");
    
                        wallet = new Wallet({
                                userId:user._id,
                                history: [{
                                amount: 100,
                                type: 'Credit',
                                newBalance:100
                            }],
                            balance: Number(100)
                        });
                        await wallet.save();
                    }
                }
    
                // wallet for new user
    
                const wallet = new Wallet({
                        userId: userId,
                        history: [{
                        amount: 50,
                        type: 'Credit',
                        newBalance:Number(50)
                        
                    }],
                    balance: Number(50)
                });
                await wallet.save();
            }
    
    
            delete req.session.referral

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
        const products = await Product.find({ isListed: false });
        const category = await Category.find({ isBlocked: false })

        return res.render('shop', { products: products, category: category, sortOption: "",search:"", selectedCategory:"",selectedPriceRange:"" });


    } catch (error) {
        console.log(error.message)
    }

}
const sortFilter = async (req, res) => {
    try {
        const category = await Category.find({ isBlocked: false });
        const { sortOption, searchQuery, category: selectedCategory, priceRange:selectedPriceRange } = req.query;

        let filter = { isListed: false };
        if (selectedCategory) {
            filter.categoryId = selectedCategory; 
        }

        if (selectedPriceRange) {
            const [minPrice, maxPrice] = selectedPriceRange.split('-').map(Number);
            filter.$or = [
                { discountPrice: { $gte: minPrice, $lte: maxPrice } },
                // { price: { $gte: minPrice, $lte: maxPrice } }
            ];
        }

        let products;
        switch (sortOption) {
            case "newArrival":
                products = await Product.find(filter).sort({ date: -1 });
                break;
            case "priceLowToHigh":
                products = await Product.aggregate([
                    { $match: filter },
                    { $addFields: { sortPrice: { $ifNull: ["$discountPrice", "$price"] } } },
                    { $sort: { sortPrice: 1 } },
                ]);
                break;
            case "priceHighToLow":
                products = await Product.aggregate([
                    { $match: filter },
                    { $addFields: { sortPrice: { $ifNull: ["$discountPrice", "$price"] } } },
                    { $sort: { sortPrice: -1 } },
                ]);
                break;
            case "nameAZ":
                products = await Product.find(filter).sort({ name: 1 });
                break;
            case "nameZA":
                products = await Product.find(filter).sort({ name: -1 });
                break;
            default:
                products = await Product.find(filter);
                break;
        }

        if (searchQuery) {
            const regex = new RegExp(searchQuery, "i");
            products = products.filter((item) => regex.test(item.name));
        }

        res.render("shop", { products, sortOption, search: searchQuery, category, selectedCategory, selectedPriceRange });

    } catch (error) {
        console.log(error.message);
    }
};


// const sortFilter = async (req, res) => {
//     try {
//         const { sortOption,searchQuery, } = req.query;

//     
//         console.log(sortOption);
//         let products;
//         switch (sortOption) {
//             case "newArrival":
//                 console.log("newwwww");
//                 products = await Product.find({ isListed: false }).sort({ date: -1 });
//                 console.log(("whyyyy"));
//                 break;
//             case "priceLowToHigh":
//                 console.log(("low ti hhhh"));
//                 products = await Product.aggregate([
//                     { $match: { isListed: false } },
//                     { $addFields: { sortPrice: { $ifNull: ["$discountPrice", "$price"] } } },
//                     { $sort: { sortPrice: 1 } },
                    
//                 ]);
//                 console.log("low tohighhhh");
//                 break;
//             case "priceHighToLow":
//                 products = await Product.aggregate([
//                     { $match: { isListed: false } },
//                     { $addFields: { sortPrice: { $ifNull: ["$discountPrice", "$price"] } } },
//                     { $sort: { sortPrice: -1 } },
//                 ]);
//                 break;
//             case "nameAZ":
//                 products = await Product.find({ isListed: false }).sort({ name: 1 });
//                 break;
//             case "nameZA":
//                 products =await Product.find({isListed:false,}).sort({name:-1});
//                 break;
//             default:
//                 products = await Product.find({ isListed: false });
//                 break;
//         }

//         if (searchQuery) {
//             const regex = new RegExp(searchQuery, "i");
//             products = products.filter((item) => regex.test(item.name));
//           }
//         res.render("shop", { products: products, sortOption: sortOption,search:searchQuery, category: category })

//     } catch (error) {
//         console.log(error.message)
//     }
// }
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
        const userData = await User.findOne({ _id: req.session.user_id });
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(req.body.oldPassword, userData.password);
        if (!passwordMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect old password' });
        }

        const spassword = await securePassword(req.body.newPassword);
        userData.password = spassword;
        await userData.save();
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

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
const loadForgotPassword = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        res.render('forgotPassword', { user: userData });
    } catch (error) {
        console.log(error);
    }
};

const resetPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (user) {
            if (user.is_googleAuthenticated) {
                return res.status(400).json({ message: 'Unable to change password. Your account is linked with Google.' });
            }

            const token = crypto.randomBytes(20).toString('hex');
            console.log("generated token:",token);
            req.session.token = token;
            req.session.email = req.body.email;
            console.log("Session token set:", req.session.token);


            const mailOptions = {
                from: process.env.NODE_MAILER_EMAIL,
                to: req.body.email,
                subject: 'Your Password Reset Link',
                html: `
                <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                        <h3>Reset Your Password</h3>
                        <p>Click the link below to reset your password:</p>
                        <a href="http://localhost:1000/newPassword?token=${token}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        <p>Thanks for using our service!</p>
                        <p>Best regards,<br>The AUDIZO. Team</p>
                    </div>
                </div>`
            };

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                port: 587,
                secure: true,
                auth: {
                    user: process.env.NODE_MAILER_EMAIL,
                    pass: process.env.NODE_MAILER_PASS
                }
            });

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    res.status(500).json({ message: 'Error sending email' });
                } else {
                    res.status(200).json({ message: 'Password reset link has been sent to your email' });
                }
            });

        } else {
            res.status(400).json({ message: 'No such email exists. Please create an account.' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

const newPasswordForm = async (req, res) => {
    try {
        const token = req.query.token;
        console.log("tooooooooooo",token);

        if (!token) {
            return res.redirect('/login');
        }

        const userData = await User.findOne({ email: req.session.email });
        res.render('newPassword', { token, user: userData });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
};

const newPassword = async (req, res) => {
    try {
        console.log("Entering newPassword function");
        const token = req.body.token;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        console.log("Body token:", token);
        console.log("Session token:", req.session.token); 
        console.log("password:", password);
        console.log("confirm:", confirmPassword);

        if (token !== req.session.token) {
            return res.status(400).json({ message: 'Invalid token' });
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        console.log("Passwords match and token is valid");

        const hashedPassword = await securePassword(password);
        console.log("Password hashed successfully");

        const updateResult = await User.findOneAndUpdate(
            { email: req.session.email },
            { password: hashedPassword }
        );
        console.log("User password updated:", updateResult);

        delete req.session.token;
        console.log("Session token deleted");

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password. Please try again later.' });
    }
};



const loadReferralLink = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id });
        res.render("referralLink", { user: userData });

    } catch (error) {
        console.log9error.message
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
    sortFilter,
    productDetail,
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
    loadForgotPassword,
    resetPassword,
    newPasswordForm,
    newPassword,
    loadReferralLink,
    logoutLoad,


}