import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  firstName: "",
  lastName: "",
  email: "",
  patientId: "",
  role: "",
  isLoggedIn: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.firstName = action.payload.firstName || "";
      state.lastName = action.payload.lastName || "";
      state.email = action.payload.email || "";
      state.patientId = action.payload.patientId || "";
      state.role = action.payload.role || "";
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.firstName = "";
      state.lastName = "";
      state.email = "";
      state.patientId = "";
      state.role = "";
      state.isLoggedIn = false;
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
