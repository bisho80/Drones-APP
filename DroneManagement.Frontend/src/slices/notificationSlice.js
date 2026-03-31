import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";
import { showSnackbar } from "./uiSlice";

export const fetchMyNotifications = createAsyncThunk("notifications/fetchMine", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/notifications/me");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const markNotificationRead = createAsyncThunk("notifications/markRead", async (id, { rejectWithValue }) => {
  try {
    await api.put(`/api/notifications/${id}/read`);
    return id;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const sendAdminAlert = createAsyncThunk(
  "notifications/sendAdminAlert",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/notifications/send-admin-alert", payload);
      dispatch(showSnackbar({ severity: "success", message: "Alert sent to admin." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.items = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.items = state.items.map((x) => (x.id === action.payload ? { ...x, isRead: true } : x));
      })
      .addMatcher(
        (action) => action.type.startsWith("notifications/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("notifications/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        }
      );
  }
});

export default notificationSlice.reducer;

