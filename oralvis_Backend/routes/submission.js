const express = require("express");
const submissionRouter = express.Router();
const Submission = require("../models/Submission");
const { userAuth } = require("../middleware/auth");
const multer = require("multer");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure "uploads" folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

submissionRouter.post(
  "/submissions",
  userAuth,
  upload.array("images", 5),
  async (req, res) => {
    try {
      console.log("inside Submissions");
      const { name, patientId, email, note } = req.body;

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one image is required" });
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
  }
);

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

submissionRouter.get("/admin/submission", userAuth, async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json({
      message: "All submissions fetched successfully",
      data: submissions,
    });
  } catch (error) {
    console.log("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
});

// get single submission by id//
submissionRouter.get("/admin/submissions/:id", userAuth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission)
      return res.status(404).json({ message: "Submission not found" });
    res.status(200).json({ data: submission });
  } catch (error) {
    res.status(500).json({ message: "Error fetching submission" });
  }
});

submissionRouter.post(
  "/admin/submissions/:id/annotate",
  userAuth,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { annotationJson, annotatedImage } = req.body;

      const submission = await Submission.findById(id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      // Save annotation overlay (transparent PNG) to temp file
      const base64Data = annotatedImage.replace(/^data:image\/png;base64,/, "");
      const overlayFileName = `overlay-${Date.now()}.png`;
      const overlayFilePath = path.join("uploads", overlayFileName);
      fs.writeFileSync(overlayFilePath, base64Data, "base64");

      // Get the original uploaded image (first one from images array)
      // Check if the path already includes 'uploads' directory
      let originalImagePath;
      const originalImageName = submission.images[0];
      
      if (originalImageName.startsWith('uploads/') || originalImageName.startsWith('uploads\\')) {
        // Path already includes uploads directory
        originalImagePath = originalImageName;
      } else {
        // Path doesn't include uploads directory, so add it
        originalImagePath = path.join("uploads", originalImageName);
      }

      // Verify the file exists before processing
      if (!fs.existsSync(originalImagePath)) {
        // Clean up overlay file
        if (fs.existsSync(overlayFilePath)) {
          fs.unlinkSync(overlayFilePath);
        }
        return res.status(404).json({ 
          message: "Original image file not found",
          path: originalImagePath 
        });
      }

      // Merge overlay + original using sharp
      const mergedFileName = `annotated-${Date.now()}.png`;
      const mergedFilePath = path.join("uploads", mergedFileName);

      await sharp(originalImagePath)
        .composite([{ input: overlayFilePath, blend: "over" }])
        .toFile(mergedFilePath);

      // Update submission
      submission.annotationData = annotationJson;
      submission.annotatedImageUrl = mergedFilePath.replace(/\\/g, "/"); // normalized path
      submission.status = "annotated";
      await submission.save();

      // Clean up overlay file
      if (fs.existsSync(overlayFilePath)) {
        fs.unlinkSync(overlayFilePath);
      }

      res.status(200).json({
        message: "Annotation saved successfully",
        data: submission,
      });
    } catch (error) {
      console.error("Error saving annotation:", error);
      res.status(500).json({ message: "Error saving annotation", error: error.message });
    }
  }
);


submissionRouter.post("/admin/submissions/report/:id", userAuth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const reportsDir = path.join(__dirname, "../uploads/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${submission.patientId || submission._id}_report.pdf`;
    const filePath = path.join(reportsDir, fileName);

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Pipe directly to response for download
    doc.pipe(res);

    // --- Header with Logo/Branding (Optional) ---
    doc.fontSize(20).font('Helvetica-Bold').text("Oral Health Screening Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text("Professional Dental Analysis", { align: "center" });
    doc.moveDown(2);

    // --- Patient Details Section ---
    doc.fontSize(14).font('Helvetica-Bold').text("Patient Information", { underline: true });
    doc.moveDown(0.5);
    
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Patient ID: ${submission.patientId || 'N/A'}`, 50, doc.y);
    doc.text(`Name: ${submission.name || 'N/A'}`, 50, doc.y + 15);
    doc.text(`Email: ${submission.email || 'N/A'}`, 50, doc.y + 15);
    doc.text(`Report Date: ${reportDate}`, 50, doc.y + 15);
    doc.text(`Status: ${submission.status || 'N/A'}`, 50, doc.y + 15);
    
    if (submission.note && submission.note.trim()) {
      doc.text(`Note: ${submission.note}`, 50, doc.y + 15);
    }
    
    doc.moveDown(2);

    // --- Annotated Image Section ---
    doc.fontSize(14).font('Helvetica-Bold').text("Clinical Analysis", { underline: true });
    doc.moveDown(1);

    if (submission.annotatedImageUrl) {
      // Handle different path formats
      let imgPath;
      if (submission.annotatedImageUrl.startsWith('uploads/')) {
        imgPath = path.join(__dirname, "..", submission.annotatedImageUrl);
      } else {
        imgPath = path.join(__dirname, "../uploads", submission.annotatedImageUrl);
      }
      
      if (fs.existsSync(imgPath)) {
        try {
          // Calculate image dimensions to fit properly
          const availableWidth = 500;
          const availableHeight = 300;
          
          doc.image(imgPath, {
            fit: [availableWidth, availableHeight],
            align: "center"
          });
          doc.moveDown(1);
        } catch (imageError) {
          console.error("Error adding image to PDF:", imageError);
          doc.fontSize(11).font('Helvetica').text("Error loading annotated image.", { align: "center" });
          doc.moveDown(1);
        }
      } else {
        console.log("Annotated image not found at:", imgPath);
        doc.fontSize(11).font('Helvetica').text("Annotated image not available.", { align: "center" });
        doc.moveDown(1);
      }
    } else {
      doc.fontSize(11).font('Helvetica').text("No annotated image available.", { align: "center" });
      doc.moveDown(1);
    }

    // --- Treatment Recommendations Legend ---
    doc.fontSize(14).font('Helvetica-Bold').text("Treatment Recommendations Legend", { underline: true });
    doc.moveDown(1);

    const recommendations = [
      { text: "Inflamed or Red Gums", color: "red", description: "Indicates gingivitis or periodontal inflammation" },
      { text: "Braces or Clear Aligner", color: "blue", description: "Orthodontic treatment recommended" },
      { text: "Receded Gums", color: "orange", description: "Gum recession requiring attention" },
      { text: "Stains", color: "brown", description: "Dental staining or discoloration" },
      { text: "Attrition", color: "green", description: "Tooth wear or grinding damage" },
    ];

    let currentY = doc.y;
    
    recommendations.forEach((rec, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      // Draw colored indicator square
      doc.rect(50, currentY, 12, 12).fillAndStroke(rec.color, 'black');
      
      // Add recommendation text
      doc.fillColor("black")
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(rec.text, 70, currentY + 2);
      
      // Add description
      doc.fontSize(10)
         .font('Helvetica')
         .text(rec.description, 70, currentY + 15, { width: 450 });
      
      currentY += 35;
    });

    // --- Disclaimer Section ---
    doc.moveDown(2);
    if (doc.y > 650) {
      doc.addPage();
    }
    
    doc.fontSize(12).font('Helvetica-Bold').text("Important Disclaimer", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
       .text("This report is generated for screening purposes only and should not replace professional dental consultation. Please consult with a qualified dentist for proper diagnosis and treatment planning.", {
         width: 500,
         align: 'justify'
       });

    // --- Footer ---
    doc.moveDown(1);
    doc.fontSize(8).text(`Generated on ${new Date().toISOString()}`, { align: 'center' });

    // Finalize PDF
    doc.end();

    // Save to file system as well (optional - for record keeping)
    const fileStream = fs.createWriteStream(filePath);
    const doc2 = new PDFDocument({ size: "A4", margin: 50 });
    doc2.pipe(fileStream);
    
    // Duplicate the PDF content for file storage (you can extract this to a function)
    // ... (same content as above)
    doc2.end();

    fileStream.on("finish", async () => {
      try {
        const fileUrl = `http://localhost:8080/uploads/reports/${fileName}`;
        submission.reportUrl = fileUrl;
        submission.status = "reported";
        await submission.save();
        console.log("PDF saved and submission updated successfully");
      } catch (dbError) {
        console.error("Error updating submission:", dbError);
      }
    });

  } catch (error) {
    console.error("Error generating report:", error);
    
    // Ensure response is sent even if there's an error
    if (!res.headersSent) {
      res.status(500).json({ 
        message: "Error generating report", 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
});

module.exports = submissionRouter;
module.exports = submissionRouter;
