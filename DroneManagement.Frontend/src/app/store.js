import { configureStore } from "@reduxjs/toolkit";
import droneReducer from "../slices/droneSlice";
import flightRequestReducer from "../slices/flightRequestSlice";
import masterDataReducer from "../slices/masterDataSlice";
import userReducer from "../slices/userSlice";
import uiReducer from "../slices/uiSlice";
import permitReducer from "../slices/permitSlice";
import authReducer from "../slices/authSlice";
import notificationReducer from "../slices/notificationSlice";

export const store = configureStore({
  reducer: {
    drones: droneReducer,
    flightRequests: flightRequestReducer,
    permits: permitReducer,
    masterData: masterDataReducer,
    users: userReducer,
    ui: uiReducer,
    auth: authReducer,
    notifications: notificationReducer
  }
});
