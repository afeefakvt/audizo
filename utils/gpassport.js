const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleUser = require('../models/googleModel'); // Adjust the path to your user model
require('dotenv').config();
const User = require("../models/userModel")


passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})

passport.use(new GoogleStrategy({
  clientID: process.env.ClientId,
  clientSecret: process.env.ClientSecret,
  callbackURL: 'http://localhost:1000/auth/google/callback',
  passReqToCallback: true,
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
        const newUser = new googleUser({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.email
        });

        await newUser.save()
        return done(null, profile)
    } catch (e) {
        console.log(e,"error occured while saving to database");
    }
}
))
