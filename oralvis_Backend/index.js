const express = require('express');
const connectDB = require("./database/db");
const authRouter = require("./routes/auth");
const submissionRouter = require("./routes/submission")
const cookieParser = require("cookie-parser"); 
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 8080;

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded images
app.use("/uploads", express.static(uploadsDir));

app.use(cookieParser());
app.use(express.json())
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))


app.use("/api/",authRouter);
app.use("/api/",submissionRouter);



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