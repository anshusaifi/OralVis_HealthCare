const express = require("express");
const authRouter = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const {validateSignupData} = require("../utils/Validate");
const { nanoid } = require("nanoid");


authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    console.log(user);
    if (!user) {
      throw new Error("Email not Valid");
    }

    const isPassword = await user.validatePassword(password);
    if (isPassword) {
      const token = await user.getJWT();
      res.cookie("token", token);
      res.status(200).json({
        message : "User Login Succesfully",
        data : user,
        role:user.role
      })
    }
    if (!isPassword) {
      return res.status(401).send("password not valid");
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
});





authRouter.post("/signup", async (req, res) => {
  try {
    validateSignupData(req);
    console.log(req.body);
    const {
      firstName,
      lastName,
      email,
      password,
      
    } = req.body;

    if (
      await User.findOne({
        email: req.body.email,
      })
    ) {
      res.json({
        message: "Email already Exists",
      });
    }

    
    const hashPassword = await bcrypt.hash(password, 10);
    // console.log(hashPassword);
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashPassword,
      patientId :"PAT-" + nanoid(6)
    });

    await user.save();
    res.json({
      message : "user saved Succesfully",
      data : user
    })
  } catch (error) {
    res.status(400).send("error" + error.message);
  }
});

module.exports = authRouter;
