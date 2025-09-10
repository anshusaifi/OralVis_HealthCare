// models/Submission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links to the patient who submitted
      required: true,
    },
    patientId: {
      type: String,
      required: true, // auto-generated at registration
    },
    note: {
      type: String,
      required: true, // patient’s description of the problem
    },
    imageUrl: {
      type: String,
      required: true, // path/URL of uploaded teeth photo
    },
    annotatedImageUrl: {
      type: String, // URL of image after admin annotation
    },
    annotationData: {
      type: Object, // JSON data of shapes/lines admin drew
    },
    reportUrl: {
      type: String, // PDF report URL
    },
    status: {
      type: String,
      enum: ["uploaded", "annotated", "reported"],
      default: "uploaded",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt
);

module.exports = mongoose.model("Submission", submissionSchema);
