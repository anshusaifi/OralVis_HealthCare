const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      index: true,
      required: true,
      minLength: 4,
      maxLength: 40,
    },

    lastName: {
      type: String,
    },
    email: {
      unique: true,
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email not valid");
        }
      },
    },

    patientId: {
      type: String,
      unique: true,
      sparse: true, // allows admins to not have patientId
    },

    role: { 
        type: String,
        enum: ["patient", "admin"],
        default: "patient"
         },

    password: {
      type: String,
    }
},
{
    timestamps: true,
  }
);
userSchema.methods.getJWT = async function () {
  const user = this;
  console.log("ye user hai...");
  console.log(user);
  const token = await jwt.sign({ _id: user._id }, "DEVTINDER@7099", {
    expiresIn: "7d",
  });
  return token;
};

userSchema.methods.validatePassword = async function (passwordbyUser) {
  const user = this;
  const passwordHash = user.password;
  const isPasswordValid = await bcrypt.compare(passwordbyUser, passwordHash);
  return isPasswordValid;
};

module.exports = mongoose.model("User", userSchema);





