import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ReactSketchCanvas } from "react-sketch-canvas";

function AdminReview() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const canvasRef = useRef();
  const navigate = useNavigate();

  // Fetch submission
  useEffect(() => {
    async function fetchSubmission() {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/admin/submissions/${id}`,
          { withCredentials: true }
        );
        setSubmission(res.data.data);
      } catch (error) {
        console.error("Error fetching submission:", error);
      }
    }
    fetchSubmission();
  }, [id]);

  // Save annotation
  const handleSaveAnnotation = async () => {
    const annotationData = await canvasRef.current.exportPaths();
    const annotatedImage = await canvasRef.current.exportImage("png");

    try {
      await axios.post(
        `http://localhost:8080/api/admin/submissions/${id}/annotate`,
        { annotationJson: annotationData, annotatedImage },
        { withCredentials: true }
      );

      alert("Annotation saved successfully!");

      // Refresh submission so updated status comes in
      const updated = await axios.get(
        `http://localhost:8080/api/admin/submissions/${id}`,
        { withCredentials: true }
      );
      setSubmission(updated.data.data);
      navigate("/admin")
    } catch (error) {
      console.error("Error saving annotation:", error);
    }
  };

  // Generate report
  const handleGenerateReport = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/admin/submissions/${id}/report`,
        {
          withCredentials: true,
          responseType: "blob", // important to handle PDF
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "report.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  if (!submission) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Review Submission</h2>
      <p>
        <strong>Patient:</strong> {submission.name}
      </p>
      <p>
        <strong>Email:</strong> {submission.email}
      </p>
      <p>
        <strong>Note:</strong> {submission.note}
      </p>

      {/* Original Image */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Original Image</h3>
        {submission.images?.length > 0 && (
          <img
            src={`http://localhost:8080/${submission.images[0]}`}
            alt="Original"
            className="max-w-md border rounded-lg shadow"
          />
        )}
      </div>

      {/* Annotation Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Annotate</h3>
        <ReactSketchCanvas
          ref={canvasRef}
          width="600px"
          height="400px"
          strokeWidth={4}
          strokeColor="red"
          backgroundImage={`http://localhost:8080/${submission.images[0]}`}
        />

        <div className="flex gap-4 mt-4">
          <button
            onClick={handleSaveAnnotation}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Annotation
          </button>

          {/* Show only if annotated */}
         
        </div>
      </div>
    </div>
  );
}

export default AdminReview;
