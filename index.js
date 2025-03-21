const express = require("express");
const session = require("express-session");
const nocache = require("nocache");
const path = require("path");
const mongoose = require("mongoose");
const app = express();
require('dotenv').config();
const passport = require("passport");

mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
    console.log("Connected to MongoDB");
}).catch(err => {
    console.error("Could not connect to MongoDB...", err);
});

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/", nocache());
app.use("/static", express.static(path.join(__dirname, "public")));

// For user routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

// For admin routes
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

app.get("*", (req, res) => {
    res.status(404).render("404");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
