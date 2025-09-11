import Login from "./components/Login";
import PatientDashboard from "./components/Patient_dash";
import { Route, Routes, useLocation } from "react-router-dom";
import Primary from "./components/Primary";
import AdminDashboard from "./components/AdminDashboard";
import Review from "./components/Review";
import LogoutButton from "./components/LogoutButton";

function App() {
  const location = useLocation();

  // Define routes where we DO NOT want to show the logout button
  const hideLogoutPaths = ["/"];

  return (
    <div className="">
      {/* Conditionally show LogoutButton */}
      {!hideLogoutPaths.includes(location.pathname) && <LogoutButton />}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/patient" element={<Primary />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/review/:id" element={<Review />} />
      </Routes>
    </div>
  );
}

export default App;
