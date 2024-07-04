const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');
const User = require('../models/userModel')

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

const loadLogin = async (req, res) => {
    try {
        console.log("iiii");
        res.render('login');

    } catch (error) {
        console.log(error.message);
    }
}
const verifyLogin = async (req, res) => {
    try {
        console.log("iiiii");
        const email = req.body.email;
        const password = req.body.password;
        console.log("hhhhhhhhhhhhh");
        console.log(email, password);

        const adminData = await Admin.findOne({ email: email });
        if (adminData) {
            console.log(adminData);

            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if (passwordMatch) {
                req.session.admin_id = adminData._id;
                return res.redirect('/admin/home');
            } else {
                return res.render('login', { message: "Wrong password" });
            }
        } else {
            return res.render('login', { message: "No user found" });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const loadDashboard = async (req, res) => {

    try {

        console.log("kkk");
        res.render('home');
    } catch (error) {
        console.log(error.message);
    }
}

const loadUser = async (req, res) => {
    try {
        const users = await User.find({is_verified:true})
        console.log(users)
        res.render('userList',{users})
        // res.end()

    } catch (error) {
        console.log(error.message)
    }
}

const blockUser = async (req,res) => {
    try{
        const userId = req.query.id;
        const userData = await User.findByIdAndUpdate(userId,{is_blocked : true});
        if(userData){
            res.status(200).json({ message: 'User blocked successfully' });
        }else{
            res.status(400).json({ message: "User not found" });
        }
    }catch(error){
        res.send(error);
    }
};

const unblockUser = async (req,res) => {
    try{
        const userId = req.query.id;
        const userData = await User.findByIdAndUpdate(userId,{is_blocked:false});
        if(userData){
            res.status(200).json({ message: 'User unblocked successfully' });
        }else{
            res.status(200).json({ message: "Couldn't unblock user" });
        }
    }catch(error){
        res.send(error);
    }
};

const logout=async(req,res)=>{
    try{
        req.session.destroy();
        res.redirect('/admin');

    }catch(error){
        console.log(error.message);
       }
 }

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    loadUser,
    blockUser,
    unblockUser,
    logout
}