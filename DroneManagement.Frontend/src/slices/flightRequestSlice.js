import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";
import { showSnackbar } from "./uiSlice";

// Fetch all requests for admin dashboard.
export const fetchFlightRequests = createAsyncThunk(
  "flightRequests/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/flight-request");
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Fetch user requests by username.
export const fetchFlightRequestsByUsername = createAsyncThunk(
  "flightRequests/fetchByUsername",
  async (username, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/flight-request/by-username/${encodeURIComponent(username)}`);
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Create request and run no-fly evaluation on backend.
export const createFlightRequest = createAsyncThunk(
  "flightRequests/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/flight-request", payload);
      dispatch(showSnackbar({ severity: "success", message: "Flight request submitted." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Payment confirmation endpoint.
export const markRequestPaid = createAsyncThunk(
  "flightRequests/markPaid",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/flight-request/${id}/mark-paid`);
      dispatch(showSnackbar({ severity: "success", message: "Payment marked successfully." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Final approve endpoint.
export const approveFlightRequest = createAsyncThunk(
  "flightRequests/approve",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/flight-request/${id}/approve`);
      dispatch(showSnackbar({ severity: "success", message: "Request approved." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Final reject endpoint.
export const rejectFlightRequest = createAsyncThunk(
  "flightRequests/reject",
  async ({ id, reason }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/flight-request/${id}/reject`, { reason });
      dispatch(showSnackbar({ severity: "warning", message: "Request rejected." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Incident endpoint.
export const reportIncident = createAsyncThunk(
  "flightRequests/incident",
  async ({ id, note }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/flight-request/${id}/incident`, { note });
      dispatch(showSnackbar({ severity: "error", message: "Incident processed and license revoked." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const flightRequestSlice = createSlice({
  name: "flightRequests",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearFlightRequestError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlightRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFlightRequestsByUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(createFlightRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(markRequestPaid.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(approveFlightRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(rejectFlightRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(reportIncident.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("flightRequests/") &&
          (action.type.endsWith("/pending") || action.type.includes("/fetch")),
        (state, action) => {
          if (action.type.endsWith("/pending")) {
            state.loading = true;
            state.error = null;
          }
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("flightRequests/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        }
      );
  }
});

export const { clearFlightRequestError } = flightRequestSlice.actions;
export default flightRequestSlice.reducer;
