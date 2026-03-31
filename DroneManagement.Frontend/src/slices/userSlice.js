import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";
import { showSnackbar } from "./uiSlice";

// Load all users (admin).
export const fetchUsers = createAsyncThunk("users/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/users");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

// Register new user account.
export const registerUser = createAsyncThunk("users/register", async (payload, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.post("/api/users/register", payload);
    dispatch(showSnackbar({ severity: "success", message: "User registered successfully." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

// Approve user account (army/admin step).
export const approveUser = createAsyncThunk("users/approve", async (id, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/users/${id}/approve`);
    dispatch(showSnackbar({ severity: "success", message: "User approved." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const disapproveUser = createAsyncThunk("users/disapprove", async (id, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/users/${id}/disapprove`);
    dispatch(showSnackbar({ severity: "warning", message: "User disapproved." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

const userSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(disapproveUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addMatcher(
        (action) => action.type.startsWith("users/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("users/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        }
      );
  }
});

export default userSlice.reducer;
