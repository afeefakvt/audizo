const nodemailer = require('nodemailer')
const OTPModel = require('../models/otpModel')
const bcrypt = require('bcrypt');
const mongoose= require("mongoose");

let transporter = nodemailer.createTransport({
  service:'gmail' ,
  host: 'smtp.gmail.com',
    port: 587,
    secure: true, 
  auth: {
      user: process.env.NODE_MAILER_EMAIL,
      pass: process.env.NODE_MAILER_PASS,
  } 
});


let mailSender = async (email,id,htmlContent) => {
  try {
      const otp = `${Math.floor(1000 + Math.random() * 9000)}`;
      console.log(email,"*****************",id,"*************")
      const mailOptions = {
          from: process.env.NODE_MAILER_EMAIL,
          to: email,
          subject: "OTP VERIFICATION",
          html: `${htmlContent}
          <h1>${otp}<h1>`,
      };
      // Send the email
      // const hashedOTP = await bcrypt.hash(otp,10);
      await transporter.sendMail(mailOptions);
      const newOtp = new OTPModel({
        userId:id, 
          email: email,
          otp: otp,
      });
      console.log("otp",otp)
      await newOtp.save();
      console.log("Email sent successfully");
  } catch (error) {
      console.error("Error sending  email:", error);
    }
};


module.exports ={
   mailSender
};