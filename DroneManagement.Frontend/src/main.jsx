import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import { store } from "./app/store";
import { appTheme } from "./theme";
import AppRouter from "./routes/AppRouter";
import AppSnackbar from "./components/AppSnackbar";
import { LanguageProvider } from "./i18n/i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <Provider store={store}>
        <ThemeProvider theme={appTheme}>
          <CssBaseline />
          <GlobalStyles styles={{
            "html[dir='rtl'] .MuiInputBase-input": { direction: "rtl", textAlign: "right" },
            "html[dir='rtl'] .MuiFormLabel-root": { direction: "rtl" },
            "html[dir='rtl'] .MuiTableCell-root": { textAlign: "right" }
          }} />
          <AppRouter />
          <AppSnackbar />
        </ThemeProvider>
      </Provider>
    </LanguageProvider>
  </React.StrictMode>
);
