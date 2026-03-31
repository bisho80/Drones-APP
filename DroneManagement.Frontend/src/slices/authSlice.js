import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";

const savedUser = localStorage.getItem("auth_user");
const savedToken = localStorage.getItem("auth_token");

export const login = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/api/auth/login", payload);
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: savedToken || "",
    user: savedUser ? JSON.parse(savedUser) : null,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.token = "";
      state.user = null;
      state.error = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = {
          userId: action.payload.userId,
          username: action.payload.username,
          role: action.payload.role,
          baseLocation: action.payload.baseLocation
        };
        localStorage.setItem("auth_token", action.payload.token);
        localStorage.setItem("auth_user", JSON.stringify(state.user));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
