import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";
import { showSnackbar } from "./uiSlice";

// Fetch all drones (admin-wide).
export const fetchDrones = createAsyncThunk("drones/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/drone");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchMyDrones = createAsyncThunk("drones/fetchMine", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/drone/me");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

// Fetch drones by username (user-scoped view).
export const fetchDronesByUsername = createAsyncThunk(
  "drones/fetchByUsername",
  async (username, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/drone/by-username/${encodeURIComponent(username)}`);
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

// Create and assign a drone to a user account.
export const createDrone = createAsyncThunk(
  "drones/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/drone", payload);
      dispatch(showSnackbar({ severity: "success", message: "Drone added successfully." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const droneSlice = createSlice({
  name: "drones",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    clearDroneError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrones.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDrones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchDronesByUsername.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDronesByUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDronesByUsername.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(fetchMyDrones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyDrones.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyDrones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(createDrone.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  }
});

export const { clearDroneError } = droneSlice.actions;
export default droneSlice.reducer;
