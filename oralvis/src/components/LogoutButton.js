import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LogoutButton() {
  const BASE_URL = process.env.REACT_APP_BASE_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  const handleLogout = async () => {
    try {
      // Optionally clear cookie/session on backend
      await axios.post(BASE_URL+"logout", {}, { withCredentials: true });

      // Reset Redux auth state
      dispatch(logout());

      // Redirect to login page
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
    >
      Logout
    </button>
  );
}
