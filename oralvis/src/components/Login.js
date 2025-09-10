import { useState } from "react";

export default function Login() {
  const [email, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [isLoginForm, setIsLoginForm] = useState(true);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLoginForm) {
      // Login
      console.log("Login with:", { email, password });
      // call /auth/login API
    } else {
      // Signup (Patient Registration)
      console.log("Signup with:", {
        firstName,
        lastName,
        email,
        password,
        note,
        file,
      });
      // call /auth/register API
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-center text-gray-800">
          {isLoginForm ? "Login" : "Sign Up"}
        </h2>

        {!isLoginForm && (
          <>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmailId(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
        />

        {!isLoginForm && (
          <>
            <textarea
              placeholder="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300"
            />

            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="w-full p-2 border border-gray-300 rounded-lg file:mr-2 file:py-1 file:px-3 file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
          </>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          {isLoginForm ? "Login" : "Sign Up"}
        </button>

        <p className="text-sm text-center text-gray-600">
          {isLoginForm ? "Don’t have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => setIsLoginForm(!isLoginForm)}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            {isLoginForm ? "Sign Up" : "Login"}
          </span>
        </p>
      </form>
    </div>
  );
}
