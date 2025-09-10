const express = require('express');
const connectDB = require("./database/db");
const authRouter = require("./routes/auth");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8080;

app.use(cookieParser());
app.use(express.json())
app.use("/",authRouter)

connectDB()

  .then(() => {
    console.log("Database Connected Succesfully");
    app.listen(PORT, () => {
      console.log("server is listening on port "+ PORT);
    });
  })
  .catch((err) => {
    console.log(err.message);
  });