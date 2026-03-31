import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, getApiErrorMessage } from "../api/client";
import { showSnackbar } from "./uiSlice";

export const fetchUnits = createAsyncThunk("masterData/fetchUnits", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/unit");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchCategories = createAsyncThunk("masterData/fetchCategories", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/category");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchLicenses = createAsyncThunk("masterData/fetchLicenses", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/license");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const fetchNoFlyZones = createAsyncThunk("masterData/fetchNoFlyZones", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/api/noflyzone");
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const createUnit = createAsyncThunk("masterData/createUnit", async (name, { dispatch, rejectWithValue }) => {
  try {
    await api.post("/api/unit", { name });
    dispatch(showSnackbar({ severity: "success", message: "Unit created." }));
    return name;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const createCategory = createAsyncThunk(
  "masterData/createCategory",
  async (name, { dispatch, rejectWithValue }) => {
    try {
      await api.post("/api/category", { name });
      dispatch(showSnackbar({ severity: "success", message: "Category created." }));
      return name;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const updateUnit = createAsyncThunk("masterData/updateUnit", async ({ id, name }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/unit/${id}`, { name });
    dispatch(showSnackbar({ severity: "success", message: "Unit updated." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const deleteUnit = createAsyncThunk("masterData/deleteUnit", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/api/unit/${id}`);
    dispatch(showSnackbar({ severity: "success", message: "Unit deleted." }));
    return id;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const updateCategory = createAsyncThunk("masterData/updateCategory", async ({ id, name }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/api/category/${id}`, { name });
    dispatch(showSnackbar({ severity: "success", message: "Category updated." }));
    return data;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const deleteCategory = createAsyncThunk("masterData/deleteCategory", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/api/category/${id}`);
    dispatch(showSnackbar({ severity: "success", message: "Category deleted." }));
    return id;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error));
  }
});

export const createLicense = createAsyncThunk(
  "masterData/createLicense",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/license", payload);
      dispatch(showSnackbar({ severity: "success", message: "License created." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const updateLicense = createAsyncThunk(
  "masterData/updateLicense",
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/license/${id}`, payload);
      dispatch(showSnackbar({ severity: "success", message: "License updated." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const deleteLicense = createAsyncThunk(
  "masterData/deleteLicense",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/api/license/${id}`);
      dispatch(showSnackbar({ severity: "success", message: "License deleted." }));
      return id;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const createNoFlyZone = createAsyncThunk(
  "masterData/createNoFlyZone",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post("/api/noflyzone", payload);
      dispatch(showSnackbar({ severity: "success", message: "No-fly zone created." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const updateNoFlyZone = createAsyncThunk(
  "masterData/updateNoFlyZone",
  async ({ id, payload }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/api/noflyzone/${id}`, payload);
      dispatch(showSnackbar({ severity: "success", message: "No-fly zone updated." }));
      return data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

export const deleteNoFlyZone = createAsyncThunk(
  "masterData/deleteNoFlyZone",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/api/noflyzone/${id}`);
      dispatch(showSnackbar({ severity: "success", message: "No-fly zone deleted." }));
      return id;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error));
    }
  }
);

const masterDataSlice = createSlice({
  name: "masterData",
  initialState: {
    units: [],
    categories: [],
    licenses: [],
    noFlyZones: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnits.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.units = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.categories = action.payload;
      })
      .addCase(fetchLicenses.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.licenses = action.payload;
      })
      .addCase(fetchNoFlyZones.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.noFlyZones = action.payload;
      })
      .addCase(createLicense.fulfilled, (state, action) => {
        state.loading = false;
        state.licenses.unshift(action.payload);
      })
      .addCase(updateUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.units = state.units.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(deleteUnit.fulfilled, (state, action) => {
        state.loading = false;
        state.units = state.units.filter((x) => x.id !== action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter((x) => x.id !== action.payload);
      })
      .addCase(updateLicense.fulfilled, (state, action) => {
        state.loading = false;
        state.licenses = state.licenses.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(deleteLicense.fulfilled, (state, action) => {
        state.loading = false;
        state.licenses = state.licenses.filter((x) => x.id !== action.payload);
      })
      .addCase(createNoFlyZone.fulfilled, (state, action) => {
        state.loading = false;
        state.noFlyZones.unshift(action.payload);
      })
      .addCase(updateNoFlyZone.fulfilled, (state, action) => {
        state.loading = false;
        state.noFlyZones = state.noFlyZones.map((x) => (x.id === action.payload.id ? action.payload : x));
      })
      .addCase(deleteNoFlyZone.fulfilled, (state, action) => {
        state.loading = false;
        state.noFlyZones = state.noFlyZones.filter((x) => x.id !== action.payload);
      })
      .addMatcher(
        (action) => action.type.startsWith("masterData/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("masterData/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        }
      );
  }
});

export default masterDataSlice.reducer;
