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

    // Create PDF with single page constraint
    const doc = new PDFDocument({ size: "A4", margin: 40 }); // Reduced margin for more space
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Pipe directly to response for download
    doc.pipe(res);

    // Calculate available page dimensions
    const pageWidth = 595.28; // A4 width in points
    const pageHeight = 841.89; // A4 height in points
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    let currentY = margin;

    // --- Header Section (Compact) ---
    doc.fontSize(18).font('Helvetica-Bold')
       .text("Oral Health Screening Report", margin, currentY, { 
         align: "center",
         width: contentWidth 
       });
    currentY += 25;
    
    doc.fontSize(9).font('Helvetica')
       .text("Professional Dental Analysis", margin, currentY, { 
         align: "center",
         width: contentWidth 
       });
    currentY += 20;

    // --- Patient Details Section (Compact) ---
    doc.fontSize(12).font('Helvetica-Bold')
       .text("Patient Information", margin, currentY);
    currentY += 15;
    
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    doc.fontSize(9).font('Helvetica');
    
    // Patient info in two columns to save space
    const leftColumnX = margin;
    const rightColumnX = margin + (contentWidth / 2);
    
    doc.text(`Patient ID: ${submission.patientId || 'N/A'}`, leftColumnX, currentY);
    doc.text(`Report Date: ${reportDate}`, rightColumnX, currentY);
    currentY += 12;
    
    doc.text(`Name: ${submission.name || 'N/A'}`, leftColumnX, currentY);
    doc.text(`Status: ${submission.status || 'N/A'}`, rightColumnX, currentY);
    currentY += 12;
    
    doc.text(`Email: ${submission.email || 'N/A'}`, leftColumnX, currentY);
    currentY += 15;
    
    if (submission.note && submission.note.trim()) {
      // Limit note length to fit on one page
      const maxNoteLength = 100;
      const truncatedNote = submission.note.length > maxNoteLength 
        ? submission.note.substring(0, maxNoteLength) + "..."
        : submission.note;
      
      doc.text(`Note: ${truncatedNote}`, margin, currentY, { width: contentWidth });
      currentY += 15;
    }

    // --- Annotated Image Section (Optimized Size) ---
    doc.fontSize(12).font('Helvetica-Bold')
       .text("Clinical Analysis", margin, currentY);
    currentY += 15;

    // Calculate remaining space for image and legend
    const remainingHeight = contentHeight - (currentY - margin) - 180; // Reserve 180pt for legend and footer
    const maxImageHeight = Math.min(remainingHeight, 250); // Max 250pt for image
    const maxImageWidth = contentWidth - 20; // Leave some padding

    if (submission.annotatedImageUrl) {
      let imgPath;
      if (submission.annotatedImageUrl.startsWith('uploads/')) {
        imgPath = path.join(__dirname, "..", submission.annotatedImageUrl);
      } else {
        imgPath = path.join(__dirname, "../uploads", submission.annotatedImageUrl);
      }
      
      if (fs.existsSync(imgPath)) {
        try {
          doc.image(imgPath, margin + 10, currentY, {
            fit: [maxImageWidth, maxImageHeight],
            align: "center"
          });
          currentY += maxImageHeight + 10;
        } catch (imageError) {
          console.error("Error adding image to PDF:", imageError);
          doc.fontSize(9).font('Helvetica')
             .text("Error loading annotated image.", margin, currentY, { align: "center" });
          currentY += 15;
        }
      } else {
        console.log("Annotated image not found at:", imgPath);
        doc.fontSize(9).font('Helvetica')
           .text("Annotated image not available.", margin, currentY, { align: "center" });
        currentY += 15;
      }
    } else {
      doc.fontSize(9).font('Helvetica')
         .text("No annotated image available.", margin, currentY, { align: "center" });
      currentY += 15;
    }

    // --- Treatment Recommendations Legend (Compact) ---
    doc.fontSize(12).font('Helvetica-Bold')
       .text("Treatment Legend", margin, currentY);
    currentY += 12;

    const recommendations = [
      { text: "Inflamed Gums", color: "red", desc: "Gingivitis/inflammation" },
      { text: "Orthodontic", color: "blue", desc: "Braces/aligner needed" },
      { text: "Gum Recession", color: "orange", desc: "Receded gums" },
      { text: "Staining", color: "brown", desc: "Discoloration" },
      { text: "Tooth Wear", color: "green", desc: "Attrition/grinding" },
    ];

    // Two column layout for legend
    const itemsPerColumn = Math.ceil(recommendations.length / 2);
    
    recommendations.forEach((rec, index) => {
      const isLeftColumn = index < itemsPerColumn;
      const columnX = isLeftColumn ? leftColumnX : rightColumnX;
      const itemY = currentY + ((index % itemsPerColumn) * 16);
      
      // Draw colored indicator square (smaller)
      doc.rect(columnX, itemY, 8, 8).fillAndStroke(rec.color, 'black');
      
      // Add recommendation text (compact)
      doc.fillColor("black")
         .fontSize(8)
         .font('Helvetica-Bold')
         .text(rec.text, columnX + 12, itemY);
      
      // Add description on same line
      doc.fontSize(7)
         .font('Helvetica')
         .text(` - ${rec.desc}`, columnX + 12 + doc.widthOfString(rec.text, { fontSize: 8 }), itemY + 1);
    });
    
    currentY += (itemsPerColumn * 16) + 10;

    // --- Footer Section (Compact) ---
    // Calculate remaining space for disclaimer
    const remainingFooterSpace = contentHeight - (currentY - margin);
    
    if (remainingFooterSpace > 30) {
      doc.fontSize(10).font('Helvetica-Bold')
         .text("Disclaimer", margin, currentY);
      currentY += 12;
      
      const disclaimerText = "This screening report is for reference only. Consult a qualified dentist for proper diagnosis and treatment.";
      
      doc.fontSize(8).font('Helvetica')
         .text(disclaimerText, margin, currentY, {
           width: contentWidth,
           align: 'justify'
         });
      
      currentY += 20;
    }

    // Bottom footer
    const footerY = pageHeight - margin - 10;
    doc.fontSize(7)
       .text(`Generated: ${new Date().toLocaleString()}`, margin, footerY, { 
         align: 'center',
         width: contentWidth 
       });

    // Finalize PDF - IMPORTANT: Only call end() once
    doc.end();

    // Optional: Save to file system (separate instance)
    const fileStream = fs.createWriteStream(filePath);
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

    // Create a separate PDF instance for file saving
    const filePDF = new PDFDocument({ size: "A4", margin: 40 });
    filePDF.pipe(fileStream);
    
    // Duplicate the same content for file storage
    currentY = margin;
    
    filePDF.fontSize(18).font('Helvetica-Bold')
           .text("Oral Health Screening Report", margin, currentY, { 
             align: "center",
             width: contentWidth 
           });
    currentY += 25;
    
    filePDF.fontSize(9).font('Helvetica')
           .text("Professional Dental Analysis", margin, currentY, { 
             align: "center",
             width: contentWidth 
           });
    currentY += 20;

    filePDF.fontSize(12).font('Helvetica-Bold')
           .text("Patient Information", margin, currentY);
    currentY += 15;
    
    filePDF.fontSize(9).font('Helvetica');
    filePDF.text(`Patient ID: ${submission.patientId || 'N/A'}`, leftColumnX, currentY);
    filePDF.text(`Report Date: ${reportDate}`, rightColumnX, currentY);
    currentY += 12;
    
    filePDF.text(`Name: ${submission.name || 'N/A'}`, leftColumnX, currentY);
    filePDF.text(`Status: ${submission.status || 'N/A'}`, rightColumnX, currentY);
    currentY += 12;
    
    filePDF.text(`Email: ${submission.email || 'N/A'}`, leftColumnX, currentY);
    currentY += 15;
    
    if (submission.note && submission.note.trim()) {
      const maxNoteLength = 100;
      const truncatedNote = submission.note.length > maxNoteLength 
        ? submission.note.substring(0, maxNoteLength) + "..."
        : submission.note;
      
      filePDF.text(`Note: ${truncatedNote}`, margin, currentY, { width: contentWidth });
      currentY += 15;
    }

    filePDF.fontSize(12).font('Helvetica-Bold')
           .text("Clinical Analysis", margin, currentY);
    currentY += 15;

    if (submission.annotatedImageUrl) {
      let imgPath;
      if (submission.annotatedImageUrl.startsWith('uploads/')) {
        imgPath = path.join(__dirname, "..", submission.annotatedImageUrl);
      } else {
        imgPath = path.join(__dirname, "../uploads", submission.annotatedImageUrl);
      }
      
      if (fs.existsSync(imgPath)) {
        try {
          filePDF.image(imgPath, margin + 10, currentY, {
            fit: [maxImageWidth, maxImageHeight],
            align: "center"
          });
          currentY += maxImageHeight + 10;
        } catch (imageError) {
          filePDF.fontSize(9).font('Helvetica')
                 .text("Error loading annotated image.", margin, currentY, { align: "center" });
          currentY += 15;
        }
      }
    }

    filePDF.fontSize(12).font('Helvetica-Bold')
           .text("Treatment Legend", margin, currentY);
    currentY += 12;

    recommendations.forEach((rec, index) => {
      const isLeftColumn = index < itemsPerColumn;
      const columnX = isLeftColumn ? leftColumnX : rightColumnX;
      const itemY = currentY + ((index % itemsPerColumn) * 16);
      
      filePDF.rect(columnX, itemY, 8, 8).fillAndStroke(rec.color, 'black');
      filePDF.fillColor("black")
             .fontSize(8)
             .font('Helvetica-Bold')
             .text(rec.text, columnX + 12, itemY);
      filePDF.fontSize(7)
             .font('Helvetica')
             .text(` - ${rec.desc}`, columnX + 12 + filePDF.widthOfString(rec.text, { fontSize: 8 }), itemY + 1);
    });
    
    currentY += (itemsPerColumn * 16) + 10;

    if (contentHeight - (currentY - margin) > 30) {
      filePDF.fontSize(10).font('Helvetica-Bold')
             .text("Disclaimer", margin, currentY);
      currentY += 12;
      
      filePDF.fontSize(8).font('Helvetica')
             .text("This screening report is for reference only. Consult a qualified dentist for proper diagnosis and treatment.", margin, currentY, {
               width: contentWidth,
               align: 'justify'
             });
    }

    filePDF.fontSize(7)
           .text(`Generated: ${new Date().toLocaleString()}`, margin, footerY, { 
             align: 'center',
             width: contentWidth 
           });

    filePDF.end();

  } catch (error) {
    console.error("Error generating report:", error);
    
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
