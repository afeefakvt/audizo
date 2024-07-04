const User = require('../models/userModel')

const is_blocked = async(req,res,next)=>{
    try{
        const userData =req.session.isLogin?await User.findOne({_id:req.session.user_id}):null
        console.log(req.session.user_id)
        if(userData){
            if(userData.is_blocked){
                req.session.isLogin=false
                return res.redirect('/login');
            }else{
                next()
            }
        }else{
            next()
        }
    }catch(error){
        res.send(error.message)
    }
}

const isLogin = async (req,res,next) => {
    try{
        if(req.session.isLogin){
            return next();
        }else{
            return res.redirect('/login');
        }
    }catch(error){
        res.send(error.message);
    }
}

const isLogout = async (req,res,next) => {
    try{
        if(req.session.isLogin){
           return res.redirect('/');
        }
        return next();
    }catch(error){
        res.send(error.message);
    }
};

const authMiddleware = async (req, res, next) => {
    try {
        if (req.session && req.session.isLogin) {
            const user = await User.findById(req.session.user_id);
            if (user) {
                res.locals.isAuthenticated = true;
                res.locals.user = user;
            } else {
                res.locals.isAuthenticated = false;
                res.locals.user = null;
            }
        } else {
            res.locals.isAuthenticated = false;
            res.locals.user = null;
        }
        next();
    } catch (error) {
        res.send(error.message);
    }
};



module.exports = {
    isLogin,
    isLogout,
    authMiddleware,
    is_blocked,
}




