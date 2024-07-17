const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

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
        const users = await User.find({ is_verified: true })
        console.log(users)
        res.render('userList', { users })
        // res.end()

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
        res.render("salesReport", { orders: orderData });

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

        res.render("salesReport", { orders: orderData });


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

        res.render("salesReport", { orders: orderData })
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