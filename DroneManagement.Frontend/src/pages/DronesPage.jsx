import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem
} from "@mui/material";
import { createDrone, fetchDronesByUsername, fetchMyDrones } from "../slices/droneSlice";
import { fetchUsers } from "../slices/userSlice";
import { fetchUnits, fetchCategories } from "../slices/masterDataSlice";

const initialForm = { username: "", name: "", model: "", serialNumber: "", unitId: "", categoryId: "" };

export default function DronesPage() {
  const dispatch = useDispatch();
  const dronesState = useSelector((state) => state.drones);
  const users = useSelector((state) => state.users.items);
  const units = useSelector((state) => state.masterData.units);
  const categories = useSelector((state) => state.masterData.categories);
  const auth = useSelector((s) => s.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);

  const [selectedUsername, setSelectedUsername] = useState(auth?.username || "");
  const [form, setForm] = useState({ ...initialForm, username: auth?.username || "" });
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    dispatch(fetchUnits());
    dispatch(fetchCategories());
    if (isAdminLike) dispatch(fetchUsers());
  }, [dispatch, isAdminLike]);

  useEffect(() => {
    if (isAdminLike) {
      if (selectedUsername) dispatch(fetchDronesByUsername(selectedUsername));
    } else {
      dispatch(fetchMyDrones());
    }
  }, [dispatch, isAdminLike, selectedUsername]);

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(createDrone({
      ...form,
      unitId: form.unitId ? Number(form.unitId) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null
    })).unwrap();
    if (selectedUsername) dispatch(fetchDronesByUsername(selectedUsername));
    setForm({ ...initialForm, username: form.username });
    setOpenCreate(false);
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{isAdminLike ? "Drone Registration & Account Drones" : "My Drones"}</Typography>
      {dronesState.error ? <Alert severity="error">{dronesState.error}</Alert> : null}

      {isAdminLike ? (
        <>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField
                label="View Drones By Username"
                select
                value={selectedUsername}
                onChange={(e) => {
                  setSelectedUsername(e.target.value);
                  setForm((prev) => ({ ...prev, username: e.target.value }));
                }}
                fullWidth
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.username}>
                    {u.username} ({u.baseLocation})
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={() => dispatch(fetchDronesByUsername(selectedUsername))}>Load</Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ sm: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Drone Module</Typography>
              <Button variant="contained" onClick={() => setOpenCreate(true)}>Add Drone</Button>
            </Stack>
          </Paper>
        </>
      ) : null}

      <Paper>
        {dronesState.loading ? <Stack p={2}><CircularProgress /></Stack> : null}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Unit</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dronesState.items.map((drone) => (
                <TableRow key={drone.id}>
                  <TableCell>{drone.id}</TableCell>
                  <TableCell>{drone.name}</TableCell>
                  <TableCell>{drone.model}</TableCell>
                  <TableCell>{drone.serialNumber}</TableCell>
                  <TableCell>{drone.user?.username || auth?.username}</TableCell>
                  <TableCell>{drone.unit?.name || "-"}</TableCell>
                  <TableCell>{drone.category?.name || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
        <DialogTitle>Add Drone</DialogTitle>
        <DialogContent>
          <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={onSubmit}>
            <TextField
              label="Username"
              select
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              fullWidth
            >
              {users.map((u) => (
                <MenuItem key={u.id} value={u.username}>
                  {u.username} ({u.baseLocation})
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
              <TextField label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required fullWidth />
            </Stack>
            <TextField label="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} required fullWidth />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Unit" select value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} fullWidth>
                <MenuItem value="">None</MenuItem>
                {units.map((u) => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
              </TextField>
              <TextField label="Category" select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} fullWidth>
                <MenuItem value="">None</MenuItem>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Stack>
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
              <Button type="submit" variant="contained">Create</Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
