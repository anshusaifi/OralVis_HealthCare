const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    note: {
      type: String,
      required: true,
    },
    images: [{
      type: String, // Path or S3 URL
      required: true,
    }],
    annotatedImageUrl: {
      type: String, // Optional: saved after admin annotates
    },
    annotationData: {
      type: mongoose.Schema.Types.Mixed, // JSON of annotations (shapes, coords, etc.)
    },
    reportUrl: {
      type: String, 
      default : null// PDF file path or S3 URL
    },
    status: {
      type: String,
      enum: ["uploaded", "annotated", "reported"],
      default: "uploaded",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
