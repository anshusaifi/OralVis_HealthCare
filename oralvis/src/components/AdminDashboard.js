import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const BASE_URL = process.env.REACT_APP_BASE_URL;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(
          BASE_URL+"/admin/submission",
          {
            withCredentials: true,
          }
        );
        setSubmissions(res.data.data || []);
      } catch (error) {
        console.error("Error fetching submissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {submissions.length === 0 ? (
        <p className="text-gray-600">No submissions found.</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-2xl bg-white">
          <table className="w-full border-collapse">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-3 text-left">Patient ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Note</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Created At</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, idx) => (
                <tr
                  key={sub._id || idx}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-3">{sub.patientId}</td>
                  <td className="p-3">{sub.name}</td>
                  <td className="p-3">{sub.email}</td>
                  <td className="p-3">{sub.note}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        sub.status === "uploaded"
                          ? "bg-yellow-100 text-yellow-800"
                          : sub.status === "annotated"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 text-center space-x-2">
                    {/* Review Button */}
                    <Link to={`/admin/review/${sub._id}`}>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                        Review
                      </button>
                    </Link>

                    {/* Generate Report Button (only if annotated) */}
                    {sub.status === "annotated" && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await axios.post(
                              `${BASE_URL}/admin/submissions/report/${sub._id}`,
                              {}, // no request body
                              {
                                withCredentials: true,
                                responseType: "blob",
                              }
                            );

                            // Create download link dynamically
                            const url = window.URL.createObjectURL(
                              new Blob([res.data])
                            );
                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute(
                              "download",
                              `${sub.patientId}_oral_health_report.pdf`
                            );
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                          } catch (error) {
                            console.error("Error generating report:", error);
                            alert("Failed to generate report");
                          }
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                      >
                        Generate Report
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
