const express = require("express");
const submissionRouter = express.Router();
const Submission = require("../models/Submission")
const {userAuth} = require("../middleware/auth");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) { 
    cb(null, "uploads/"); // make sure "uploads" folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });
 


submissionRouter.post("/submissions",userAuth,upload.array("images", 5),async(req,res)=>{
     
     try {
      console.log("inside Submissions")
    const { name, patientId, email, note } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    // Collect all uploaded file paths
    const images = req.files.map((file) => file.path);

    const newSubmission = new Submission({
      name,
      patientId,
      email,
      note,
      images, // array instead of single string
      status: "uploaded",
    });

    await newSubmission.save();

    res.status(201).json({
      message: "Submission uploaded successfully with multiple files",
      data: newSubmission,
    });
  } catch (error) {
    console.error("Error uploading submission:", error);
    res.status(500).json({ message: "Error uploading submission", error });
  }
  
})

submissionRouter.get("/mine", userAuth, async (req, res) => {
  try {
    // req.user is set by authMiddleware (from JWT)
    const patientEmail = req.user.email;

    const submissions = await Submission.find({ email: patientEmail });
 
    res.status(200).json({
      message: "Your submissions fetched successfully",
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
});
module.exports = submissionRouter;