const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Order = require('../models/orderModel');
const { format } = require('sharp');

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
        let orderData = await Order.aggregate([
            {
                $lookup:{
                    from:"users",
                    localField:"userId",
                    foreignField:"_id",
                    as:"user"
                },   
            },
            {$unwind:"$items"},
            {$match:{"items.itemStatus":"Delivered"}},
            {$sort:{date:-1}}
        ]);


        let bestProducts = await Order.aggregate([
            {$unwind:"$items"},
            {$group:{
                _id:"$items.productName",
                totalQuantity:{$sum:"$items.quantity"},
                image:{$first:"$items.image"}
            }},
            {$sort:{
                totalQuantity:-1
            }},
            {$limit:3},
            {$project:{
                productName:"$_id",
                totalQuantity:1,
                image:1
            }}
        ]);

        let bestCategories=await Order.aggregate([
            {$unwind:"$items"},
            {$group:{
                _id:"$items.categoryName",
                totalQuantity:{$sum:"$items.quantity"},
            }},
            {$sort:{
                totalQuantity:-1
            }},
            {$limit:2},
            {$project:{
                categoryName:"$_id",
                totalQuantity:-1
            }}
        ]);
        revenue=0;
        totalOrders=0;
        discount=0;
        for(let order of orderData){
            totalOrders++;
            revenue+= order.items.finalPrice*order.items.quantity;
            discount+=order.items.price*order.items.quantity - order.items.finalPrice*order.items.quantity
        }
        let results = await Order.aggregate([
            {$unwind:"$items"},
            {$match:{
                "items.itemStatus":"Delivered"
            }},
            {$project:{
                dayOfWeek:{$dayOfWeek:"$date"},
                revenue:{$multiply:["$items.finalPrice","$items.quantity"]},

            }},
            {$group:{
                _id:"$dayOfWeek",
                total:{$sum:"$revenue"}
            }},
            {$sort:{_id:1}}
        ]);

        function getDayName(dayOfWeek){
            const daysOfWeek = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ];
            return daysOfWeek[dayOfWeek-1]
        }
const labels = results.map((result)=>getDayName(result._id));
const values = results.map((result)=>result.total);

let fromDate;
let toDate;
let interval;
let groupByField;
let labelFunction;

if(req.query.interval==="monthly"){
    interval = 'month';
    groupByField = {$month:"$date"};
    labelFunction = (date)=>{
        return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date); 
    }
}else if(req.query.interval==='yearly'){
    interval = 'year';
    groupByField = {$year:"$date"};
    labelFunction = (date)=>{
        return date.getFullYear().toString();
    }

}else{
    interval = 'week';
    groupByField = {$week:"$date"};
    labelFunction = (date)=>{
        return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date); 

    };
}
const today = new Date();
if(interval ==='week'){
    toDate= new Date(today);
    fromDate = new Date(toDate);
    fromDate.setDate(fromDate.getDate()-6);
}else if(interval ==='month'){
    fromDate = new Date(today.getFullYear(),today.getMonth(),1);
    toDate = new Date(today.getFullYear(),today.getMonth() +1,0);

}else if(interval==="year"){
    fromDate = new Date(today.getFullYear(),0,1);
    toDate = new Date(today.getFullYear(),11,31);
}

let results2;
if(interval ==='week'){
    results2 = await Order.aggregate([
        {$unwind:"$items"},
        {$match:{
            date:{$gte:fromDate,$lte:toDate},
            "items.itemStatus":"Delivered"
        }},
        {$project:{
            dayOfWeek:{$dayOfWeek:"$date"},
            revenue:{$multiply: ["$items.quantity","$items.finalPrice"]}
        }},
        {$group:{
            _id:"$dayOfWeek",
            total:{$sum:"$revenue"}
        }},
        {$sort:{_id:1}}
    ])
}else if(interval ==="month"){
    results2 = await Order.aggregate([
        {$unwind:"$items"},
        {$match:{
            date:{$gte:fromDate,$lte:toDate},
            "items.itemStatus":"Delivered"
        }},
        {$project:{
            month:{$month:"$date"},
            revenue:{$multiply:["$items.quantity","$items.finalPrice"]},
        }},
        {$group:{
            _id:{month:"$month"},
            total:{$sum:"$revenue"}
        }},
        {$sort:{"_id.month":1}}

    ]);
    
}else if(interval ==='year'){
    results2 = await Order.aggregate([
        {$unwind:"$items"},
        {$match:{
            date:{$gte:fromDate,$lte:toDate},
            "items.itemStatus":"Delivered"
        }},
        {$project:{
            year:{$year:"$date"},
            revenue:{$multiply:["$items.quantity","$items.finalPrice"]}
        }},
        {$group:{
            _id:{year:"$year"},
            total:{$sum:"$revenue"}
        }
        },
        {$sort:{"_id.year":1}}
    ])
}
function getMonthName(month){
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[month-1];
}
function formatYear(year){
    return year.toString();
}
const labels2 = results2.map((result)=>{
    if(interval==='week'){
        return getDayName(result._id);

    }else if(interval==='month'){
        return getMonthName(result._id.month);
    }else if(interval==='year'){
        return formatYear(result._id.year);
    }
})

const values2 = results2.map((result) => result.total);
        res.render('home',{
            orders:orderData,
            bestProducts:bestProducts,
            bestCategories:bestCategories,
            revenue: revenue,
            totalOrders: totalOrders,
            discount: discount,
            labels: labels,
            values: values,
            labels2:labels2,
            values2:values2,
            interval:interval
        });
    } catch (error) {
        console.log(error.message);
    }
}

const loadUser = async (req, res) => {
    try {
        let search = "";
        if (req.query.search) {
            search = req.query.search;
        }

        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * 5;

        const users = await User.find({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
            is_verified: true
        }).skip(skip).limit(5);


        const totalUsers = await User.countDocuments({
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } }
            ],
            is_verified: true,
        });


        const totalPages = Math.ceil(totalUsers / 5);
        console.log(users)
        res.render('userList', { users:users,totalPages:totalPages,currentPage:page,search:search })


    } catch (error) {
        console.log(error.message)
    }
}

const blockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        const userData = await User.findByIdAndUpdate(userId, { is_blocked: true });
        if (userData) {
            res.status(200).json({ message: 'User blocked successfully' });
        } else {
            res.status(400).json({ message: "User not found" });
        }
    } catch (error) {
        res.send(error);
    }
};

const unblockUser = async (req, res) => {
    try {
        const userId = req.query.id;
        const userData = await User.findByIdAndUpdate(userId, { is_blocked: false });
        if (userData) {
            res.status(200).json({ message: 'User unblocked successfully' });
        } else {
            res.status(200).json({ message: "Couldn't unblock user" });
        }
    } catch (error) {
        res.send(error);
    }
};
// const filterSalesInterval = async (req, res) => {
//     try {
//         const interval = req.query.interval;
//         let startDate;
//         let today = new Date();
//         // Normalize today's date to the start of the day
//         today.setHours(0, 0, 0, 0);
//         switch (interval) {
//             case "Daily":
//                 startDate = new Date(
//                     today.getFullYear(),
//                     today.getMonth(),
//                     today.getDate() - 1
//                 );
//                 break;
//             case "Weekly":
//                 startDate = new Date(
//                     today.getFullYear(),
//                     today.getMonth(),
//                     today.getDate() - 7
//                 )
//                 break;
//             case "Monthly":
//                 startDate = new Date(
//                     today.getFullYear(),
//                     today.getMonth() - 1,
//                     today.getDate()
//                 )
//                 break;
//             case "Yearly":
//                 startDate = new Date(
//                     today.getFullYear() - 1,
//                     today.getMonth(),
//                     today.getDate()
//                 )
//                 break;
//             default:
//                 startDate = new Date();
//                 break;

//         }
//         let orderData = await Order.aggregate([
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "userId",
//                     foreignField: "_id",
//                     as: "user"
//                 },
//             },
//             { $unwind: "$items" },
//             {
//                 $match: {
//                     "items.itemStatus": "Delivered",
//                     date: { $gte: startDate, $lte: new Date() },
//                 },
//             },
//             {
//                 $sort: {
//                     date: -1
//                 }
//             }
//         ]);
//         res.render("salesReport", { orders: orderData })

//     } catch (error) {
//         console.log(error.message)
//     }
// }

const filterSalesInterval = async (req, res) => {
    try {
        const interval = req.query.interval;
        let startDate;
        let today = new Date();

        // Normalize today's date to the start of the day
        today.setHours(0, 0, 0, 0);

        switch (interval) {
            case "daily":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate());
                break;
            case "weekly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() - 7);
                break;
            case "monthly":
                startDate = new Date(
                    today.getFullYear(),
                    today.getMonth() - 1,
                    today.getDate());
                break;
            case "yearly":
                startDate = new Date(
                    today.getFullYear() - 1,
                    today.getMonth(),
                    today.getDate());
                break;
            default:
                startDate = new Date();
                break;
        }

        // Add time to end of today for better matching
        let endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        let orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                },
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                    date: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $sort: {
                    date: -1
                }
            }
        ]);

        console.log(orderData, "Filtered Orders Data");
        let totalSales = orderData.length;

        let totalPrice = orderData.reduce((acc, order) => {
            return acc + (order.items.finalPrice || order.items.price) * order.items.quantity;
        }, 0);
        res.render("salesReport", { orders: orderData ,totalSales,totalPrice: totalPrice});

    } catch (error) {
        console.log(error.message);
    }
}

const filterSalesReport = async (req, res) => {
    try {
        const startDate = new Date(req?.query?.startDate);
        const endDate = new Date(req?.query?.endDate);

        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        // Ensure endDate includes the entire day
        endDate.setHours(23, 59, 59, 999);

        let orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: "$items" },
            {
                $match:
                {
                    "items.itemStatus": "Delivered",
                    date: { $gte: startDate, $lte: endDate },
                }
            },
            {
                $sort: {
                    date: -1
                }
            },
        ])
        console.log('Filtered Orders:', orderData);
        let totalSales = orderData.length;

        let totalPrice = orderData.reduce((acc, order) => {
            return acc + (order.items.finalPrice || order.items.price) * order.items.quantity;
        }, 0);

        res.render("salesReport", { orders: orderData,totalSales,totalPrice: totalPrice });


    } catch (error) {
        console.log(error.message);
    }
}
const loadSalesReport = async (req, res) => {
    try {
        let orderData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$items" },
            {
                $match: {
                    "items.itemStatus": "Delivered",
                }
            },
          
            {
                $sort: {
                    date: -1
                }
            }
        ])
        let totalSales = orderData.length;

        let totalPrice = orderData.reduce((acc, order) => {
            return acc + (order.items.finalPrice || order.items.price) * order.items.quantity;
        }, 0);

        res.render("salesReport", { orders: orderData,totalSales,totalPrice: totalPrice })
    } catch (error) {
        console.log(error.message)
    }
}


const logout = async (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/admin');

    } catch (error) {
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
    filterSalesInterval,
    filterSalesReport,
    loadSalesReport,
    logout
}