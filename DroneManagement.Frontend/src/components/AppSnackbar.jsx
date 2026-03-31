import { Alert, Snackbar } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { hideSnackbar } from "../slices/uiSlice";

// Shared snackbar renderer for success/error/info events.
export default function AppSnackbar() {
  const dispatch = useDispatch();
  const snackbar = useSelector((state) => state.ui.snackbar);

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={3500}
      onClose={() => dispatch(hideSnackbar())}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={() => dispatch(hideSnackbar())} severity={snackbar.severity} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
  );
}
