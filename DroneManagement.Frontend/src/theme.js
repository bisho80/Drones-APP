import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    primary: { main: "#005f73" },
    secondary: { main: "#ee9b00" },
    background: { default: "#e9f5f2", paper: "#ffffff" },
    success: { main: "#2a9d8f" },
    error: { main: "#d62828" },
    warning: { main: "#f4a261" }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Segoe UI', 'Tahoma', sans-serif"
  }
});
