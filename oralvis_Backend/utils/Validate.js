const validate = require("validator");

const validateSignupData = (req) => {
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName) {
    throw new Error("ERROR : Name is not Valid");
  } else if (!validate.isEmail(email)) {
    throw new Error("ERROR : Email is not Valid");
  }
  if (!password) {
    throw new Error("ERROR : Please Fill the password");
  } else if (!validate.isStrongPassword(password)) {
    throw new Error("password is not Strong");
  }
};

const isUserFieldValid = (req) => {
  const Allowed_Updates = [
    "firstName",
    "lastName",
    "email",
    "skills",

  ];
  const isAllowed = Object.keys(req.body).every((field) =>
    Allowed_Updates.includes(field)
  );
  return isAllowed;
};
module.exports = {
  validateSignupData,
  isUserFieldValid,
};
