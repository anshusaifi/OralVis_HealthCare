import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

export default function PatientSubmissionForm() {
  const BASE_URL = process.env.REACT_APP_BASE_URL;
  const [name, setName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);

  const user = useSelector((state) => state.auth);
  const {
    firstName,
    lastName,
    email: userEmail,
    patientId: userPatientId,
    isLoggedIn,
  } = user;

  // Auto-fill on login
  useEffect(() => {
    if (isLoggedIn) {
      setName(`${firstName} ${lastName}`.trim());
      setEmail(userEmail);
      setPatientId(userPatientId);
    }
  }, [firstName, lastName, userEmail, userPatientId, isLoggedIn]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("patientId", patientId);
    formData.append("email", email);
    formData.append("note", note);

    files.forEach((file) => formData.append("images", file));

    try {
      const res = await axios.post(
        BASE_URL+"/submissions",
        formData,
        {
          withCredentials: true,
        }
      );
      window.location.reload();
      console.log("Submission success:", res.data);
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-lg space-y-4"
      >
        <h2 className="text-xl font-bold text-center text-gray-800">
          Patient Submission Form
        </h2>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
        />

        <input
  type="text"
  placeholder="Patient ID"
  value={patientId}           // ✅ bind to local state
  onChange={(e) => setPatientId(e.target.value)}
  required
  className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
/>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
        />

        <textarea
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
