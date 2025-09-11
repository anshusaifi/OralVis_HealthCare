const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = "mongodb+srv://saifianash7:7mrjsHLc6wEMP6jZ@cluster0.9clfouw.mongodb.net/Oralvis_Assignment?retryWrites=true&w=majority";
  // const uri = "mongodb://127.0.0.1:27017"
 
  try {
    await mongoose.connect(uri
      
    );

   
  } catch (error) {
    console.error(" MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;