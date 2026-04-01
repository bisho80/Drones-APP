import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { approveUser, disapproveUser, fetchUsers, registerUser } from "../slices/userSlice";

const createInitialForm = () => ({
  username: "",
  password: "pass123",
  fullName: "",
  phone: "",
  email: "",
  baseLocation: "Air Base Beirut",
  role: "User"
});

export default function UsersPage() {
  const dispatch = useDispatch();
  const usersState = useSelector((state) => state.users);
  const auth = useSelector((state) => state.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState(createInitialForm());

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchUsers());
  }, [dispatch, isAdminLike]);

  if (!isAdminLike) {
    return <Alert severity="warning">You are not allowed to access this page.</Alert>;
  }

  const submitUser = async (event) => {
    event.preventDefault();
    await dispatch(registerUser(form)).unwrap();
    setOpenCreate(false);
    setForm(createInitialForm());
    dispatch(fetchUsers());
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5, borderRadius: "5px" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Users Module</Typography>
            <Typography variant="body2" color="text.secondary">
              Registration and approval live in a dedicated module now.
            </Typography>
          </Stack>
          <Button variant="contained" onClick={() => setOpenCreate(true)}>
            Add User
          </Button>
        </Stack>
      </Paper>

      {usersState.error ? <Alert severity="error">{usersState.error}</Alert> : null}

      <Paper sx={{ borderRadius: "5px" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Base</TableCell>
                <TableCell>Approved</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersState.items.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.baseLocation}</TableCell>
                  <TableCell>{user.isApproved ? "Yes" : "No"}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" disabled={user.isApproved} onClick={() => dispatch(approveUser(user.id))}>
                        Approve
                      </Button>
                      <Button size="small" color="warning" disabled={!user.isApproved} onClick={() => dispatch(disapproveUser(user.id))}>
                        Disapprove
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="md">
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={submitUser}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required fullWidth />
              <TextField label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required fullWidth />
              <TextField label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required fullWidth />
              <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
              <TextField
                label="Base Location"
                value={form.baseLocation}
                onChange={(e) => setForm({ ...form, baseLocation: e.target.value })}
                required
                fullWidth
                disabled={auth?.role === "Admin"}
              />
            </Stack>
            <TextField label="Role" select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required fullWidth>
              <MenuItem value="User">User</MenuItem>
              {auth?.role === "SuperAdmin" ? <MenuItem value="Admin">Admin</MenuItem> : null}
              {auth?.role === "SuperAdmin" ? <MenuItem value="SuperAdmin">SuperAdmin</MenuItem> : null}
            </TextField>
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
