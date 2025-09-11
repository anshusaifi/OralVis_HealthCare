import React, { useEffect, useState } from "react";
import axios from "axios";

function SubmissionRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReport, setDownloadingReport] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8080/api/mine", {
          withCredentials: true,
        });

        console.log("API response:", res.data);
        setRecords(res.data.data); 
      } catch (error) {
        console.error("Error fetching submission records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const handleDownloadReport = async (recordId, patientId) => {
    try {
      setDownloadingReport(recordId);
      
      const response = await axios.post(
        `http://localhost:8080/api/admin/submissions/report/${recordId}`,
        {},
        {
          withCredentials: true,
          responseType: 'blob', // Important for file download
        }
      );

      // Create blob URL and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${patientId}_oral_health_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report. Please try again or contact support.");
    } finally {
      setDownloadingReport(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      uploaded: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Uploaded" },
      annotated: { bg: "bg-blue-100", text: "text-blue-800", label: "Annotated" },
      reported: { bg: "bg-green-100", text: "text-green-800", label: "Report Ready" },
    };

    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "uploaded":
        return "Your submission is being reviewed by our medical team.";
      case "annotated":
        return "Review completed. Report is being generated.";
      case "reported":
        return "Your report is ready for download!";
      default:
        return "Status unknown.";
    }
  };

  if (loading) {
    return (
      <div className="mt-6 w-full max-w-5xl">
        <h2 className="text-lg font-bold mb-4">My Submissions</h2>
        <div className="flex justify-center items-center p-8 bg-white rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading your submissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full max-w-5xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">My Submissions</h2>
        <span className="text-sm text-gray-600">
          Total: {records.length}
        </span>
      </div>

      {records.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <div
              key={record._id}
              className="bg-white shadow-lg rounded-lg p-6 border hover:shadow-xl transition-shadow"
            >
              {/* Header with Status */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{record.name}</h3>
                  <p className="text-sm text-gray-600">ID: {record.patientId}</p>
                </div>
                {getStatusBadge(record.status)}
              </div>

              {/* Patient Info */}
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {record.email}
                </p>
                {record.note && (
                  <p className="text-sm">
                    <span className="font-medium">Note:</span> {record.note}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Submitted:</span>{" "}
                  {new Date(record.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Status Message */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {getStatusMessage(record.status)}
                </p>
              </div>

              {/* Image */}
              {record.images && record.images.length > 0 && (
                <div className="mb-4">
                  <img
                    src={`http://localhost:8080/${record.images[0]}`}
                    alt="submission"
                    className="h-32 w-full object-cover rounded-lg border"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/200';
                      e.target.alt = 'Image not available';
                    }}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                {record.status === "reported" && (
                  <button
                    onClick={() => handleDownloadReport(record._id, record.patientId)}
                    disabled={downloadingReport === record._id}
                    className={`w-full py-2 px-4 rounded-lg text-white font-medium transition-colors ${
                      downloadingReport === record._id
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {downloadingReport === record._id ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Downloading...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Report
                      </span>
                    )}
                  </button>
                )}
                
                {record.status === "annotated" && (
                  <div className="w-full py-2 px-4 rounded-lg bg-blue-100 text-blue-800 text-center text-sm">
                    Report generation in progress...
                  </div>
                )}
                
                {record.status === "uploaded" && (
                  <div className="w-full py-2 px-4 rounded-lg bg-yellow-100 text-yellow-800 text-center text-sm">
                    Awaiting medical review...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-500">
            Your submissions will appear here after you submit them for review.
          </p>
        </div>
      )}
    </div>
  );
}

export default SubmissionRecords;