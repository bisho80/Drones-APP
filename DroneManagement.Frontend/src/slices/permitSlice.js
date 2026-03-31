import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";
import { showSnackbar } from "./uiSlice";

export const fetchPermits = createAsyncThunk("permits/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/permit-workflow");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchPermitsByUsername = createAsyncThunk(
  "permits/fetchByUsername",
  async (username, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/permit-workflow/by-username/${encodeURIComponent(username)}`);
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchMyPermits = createAsyncThunk("permits/fetchMine", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/permit-workflow/me");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchAirForceOps = createAsyncThunk("permits/fetchAirForceOps", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/permit-workflow/airforce-ops");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const submitPermitRequest = createAsyncThunk(
  "permits/submit",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/permit-workflow/submit", payload);
      dispatch(showSnackbar({ severity: "success", message: "Permit request submitted." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const approvePermitInternally = createAsyncThunk(
  "permits/internalApprove",
  async (permitId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/internal-approve`);
      dispatch(showSnackbar({ severity: "success", message: "Permit moved to Pending Payment." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const rejectPermit = createAsyncThunk(
  "permits/reject",
  async ({ permitId, reason, refundPickupAt, refundPickupDesk }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/reject`, { reason, refundPickupAt, refundPickupDesk });
      dispatch(showSnackbar({ severity: "warning", message: "Permit rejected." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const processPermitPayment = createAsyncThunk(
  "permits/processPayment",
  async (permitId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/process-payment`);
      dispatch(showSnackbar({ severity: "success", message: "Payment processed. Permit approved." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const submitPermitPayment = createAsyncThunk(
  "permits/submitPayment",
  async (permitId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/submit-payment`);
      dispatch(showSnackbar({ severity: "info", message: "Cash payment submitted for admin confirmation." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const confirmPermitCashPayment = createAsyncThunk(
  "permits/confirmCashPayment",
  async (permitId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/confirm-cash-payment`);
      dispatch(showSnackbar({ severity: "success", message: "Cash payment confirmed. Waiting for license." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const issuePermitLicense = createAsyncThunk(
  "permits/issueLicense",
  async (permitId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/issue-license`);
      dispatch(showSnackbar({ severity: "success", message: "License issued and permit approved." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const reportPermitIncident = createAsyncThunk(
  "permits/reportIncident",
  async ({ permitId, note, refundPickupAt, refundPickupDesk }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/permit-workflow/${permitId}/incident`, { note, refundPickupAt, refundPickupDesk });
      dispatch(showSnackbar({ severity: "warning", message: "Incident processed and user notified for refund pickup." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const fetchPermitReceipt = createAsyncThunk(
  "permits/fetchReceipt",
  async (permitId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/permit-workflow/${permitId}/receipt`, {
        headers: { "X-Is-Classified": "true" }
      });
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const sendRefundToAdmin = createAsyncThunk("permits/sendRefundToAdmin", async (permitId, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/permit-workflow/${permitId}/refund/send-to-admin`);
    dispatch(showSnackbar({ severity: "info", message: "Refund sent to admin desk." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const receiveRefundByAdmin = createAsyncThunk("permits/receiveRefundByAdmin", async (permitId, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/permit-workflow/${permitId}/refund/receive-by-admin`);
    dispatch(showSnackbar({ severity: "success", message: "Refund received by admin." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const payRefundToUser = createAsyncThunk("permits/payRefundToUser", async (permitId, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/permit-workflow/${permitId}/refund/pay-to-user`);
    dispatch(showSnackbar({ severity: "success", message: "Refund paid to user." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

const permitSlice = createSlice({
  name: "permits",
  initialState: {
    items: [],
    opsItems: [],
    receipt: null,
    loading: false,
    error: null
  },
  reducers: {
    clearPermitReceipt: (state) => {
      state.receipt = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermits.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchPermitsByUsername.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchMyPermits.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.items = action.payload;
      })
      .addCase(fetchAirForceOps.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.opsItems = action.payload;
      })
      .addCase(submitPermitRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(approvePermitInternally.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(rejectPermit.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(processPermitPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(submitPermitPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(confirmPermitCashPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(issuePermitLicense.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(sendRefundToAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(receiveRefundByAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(payRefundToUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(reportPermitIncident.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
        state.opsItems = state.opsItems.map((x) => (x.id === action.payload.id ? { ...x, ...action.payload } : x));
      })
      .addCase(fetchPermitReceipt.fulfilled, (state, action) => {
        state.loading = false;
        state.receipt = action.payload;
      })
      .addMatcher(
        (action) =>
          action.type.startsWith("permits/") &&
          action.type.endsWith("/pending") &&
          !action.type.startsWith("permits/fetchAll/") &&
          !action.type.startsWith("permits/fetchByUsername/") &&
          !action.type.startsWith("permits/fetchMine/") &&
          !action.type.startsWith("permits/fetchAirForceOps/"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("permits/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        }
      );
  }
});

export const { clearPermitReceipt } = permitSlice.actions;
export default permitSlice.reducer;
