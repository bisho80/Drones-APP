import { createSlice } from "@reduxjs/toolkit";

// Global UI slice for app-wide notifications.
const uiSlice = createSlice({
  name: "ui",
  initialState: {
    snackbar: {
      open: false,
      message: "",
      severity: "info"
    }
  },
  reducers: {
    showSnackbar: (state, action) => {
      state.snackbar = {
        open: true,
        message: action.payload.message,
        severity: action.payload.severity || "info"
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    }
  }
});

export const { showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
