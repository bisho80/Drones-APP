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
import { createLicense, deleteLicense, fetchLicenses, updateLicense } from "../slices/masterDataSlice";
import { fetchDrones } from "../slices/droneSlice";

const createInitialForm = () => ({
  droneId: "",
  licenseNumber: "",
  expiresAt: "",
  status: "Active"
});

export default function LicensesPage() {
  const dispatch = useDispatch();
  const { licenses, error } = useSelector((state) => state.masterData);
  const drones = useSelector((state) => state.drones.items);
  const auth = useSelector((state) => state.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const [createOpen, setCreateOpen] = useState(false);
  const [editLicense, setEditLicense] = useState(null);
  const [form, setForm] = useState(createInitialForm());

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchLicenses());
    dispatch(fetchDrones());
  }, [dispatch, isAdminLike]);

  if (!isAdminLike) {
    return <Alert severity="warning">You are not allowed to access this page.</Alert>;
  }

  const refresh = () => dispatch(fetchLicenses());

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5, borderRadius: "5px" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Licenses Module</Typography>
            <Typography variant="body2" color="text.secondary">
              Create and update licenses through popup dialogs.
            </Typography>
          </Stack>
          <Button variant="contained" onClick={() => { setForm(createInitialForm()); setCreateOpen(true); }}>
            Add License
          </Button>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ borderRadius: "5px" }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Drone</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>{license.id}</TableCell>
                  <TableCell>{license.droneId}</TableCell>
                  <TableCell>{license.licenseNumber}</TableCell>
                  <TableCell>{license.expiresAt ? license.expiresAt.slice(0, 10) : "-"}</TableCell>
                  <TableCell>{license.status}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setEditLicense({
                        ...license,
                        expiresAt: license.expiresAt ? license.expiresAt.slice(0, 10) : ""
                      })}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={async () => {
                          await dispatch(deleteLicense(license.id)).unwrap();
                          refresh();
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add License</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Drone" select value={form.droneId} onChange={(e) => setForm({ ...form, droneId: e.target.value })} fullWidth>
              {drones.map((drone) => (
                <MenuItem key={drone.id} value={drone.id}>
                  {drone.id} - {drone.serialNumber}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} fullWidth />
            <TextField label="Expiry Date" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Status" select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Revoked">Revoked</MenuItem>
            </TextField>
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(createLicense({
                    droneId: Number(form.droneId),
                    licenseNumber: form.licenseNumber,
                    expiresAt: form.expiresAt || null,
                    status: form.status
                  })).unwrap();
                  setCreateOpen(false);
                  setForm(createInitialForm());
                  refresh();
                }}
              >
                Create
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editLicense)} onClose={() => setEditLicense(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit License</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="License Number" value={editLicense?.licenseNumber || ""} onChange={(e) => setEditLicense((prev) => ({ ...prev, licenseNumber: e.target.value }))} fullWidth />
            <TextField label="Expiry Date" type="date" value={editLicense?.expiresAt || ""} onChange={(e) => setEditLicense((prev) => ({ ...prev, expiresAt: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Status" select value={editLicense?.status || "Active"} onChange={(e) => setEditLicense((prev) => ({ ...prev, status: e.target.value }))} fullWidth>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Revoked">Revoked</MenuItem>
            </TextField>
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setEditLicense(null)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(updateLicense({
                    id: editLicense.id,
                    payload: {
                      licenseNumber: editLicense.licenseNumber,
                      expiresAt: editLicense.expiresAt || null,
                      status: editLicense.status
                    }
                  })).unwrap();
                  setEditLicense(null);
                  refresh();
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
