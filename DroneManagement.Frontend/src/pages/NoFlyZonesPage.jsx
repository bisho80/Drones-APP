import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
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
  Typography
} from "@mui/material";
import { createNoFlyZone, deleteNoFlyZone, fetchNoFlyZones, updateNoFlyZone } from "../slices/masterDataSlice";

const createInitialForm = (baseLocation) => ({
  zoneName: "",
  baseLocation: baseLocation || "Air Base Beirut",
  urcLat: "",
  urcLng: "",
  llcLat: "",
  llcLng: "",
  restrictionReason: ""
});

export default function NoFlyZonesPage() {
  const dispatch = useDispatch();
  const { noFlyZones, error } = useSelector((state) => state.masterData);
  const auth = useSelector((state) => state.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const isSuperAdmin = auth?.role === "SuperAdmin";
  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState(null);
  const [form, setForm] = useState(() => createInitialForm(auth?.baseLocation));

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchNoFlyZones());
  }, [dispatch, isAdminLike]);

  useEffect(() => {
    setForm(createInitialForm(auth?.baseLocation));
  }, [auth?.baseLocation]);

  if (!isAdminLike) {
    return <Alert severity="warning">You are not allowed to access this page.</Alert>;
  }

  const refresh = () => dispatch(fetchNoFlyZones());

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5, borderRadius: "5px" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>No-Fly Zones Module</Typography>
            <Typography variant="body2" color="text.secondary">
              Restricted zones are managed through modal create and edit dialogs.
            </Typography>
          </Stack>
          <Button variant="contained" disabled={!isSuperAdmin} onClick={() => { setForm(createInitialForm(auth?.baseLocation)); setCreateOpen(true); }}>
            Add Zone
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
                <TableCell>Zone</TableCell>
                <TableCell>Base</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>URC</TableCell>
                <TableCell>LLC</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {noFlyZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>{zone.id}</TableCell>
                  <TableCell>{zone.zoneName}</TableCell>
                  <TableCell>{zone.baseLocation}</TableCell>
                  <TableCell>{zone.restrictionReason}</TableCell>
                  <TableCell>{zone.urcLat}, {zone.urcLng}</TableCell>
                  <TableCell>{zone.llcLat}, {zone.llcLng}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" disabled={!isSuperAdmin} onClick={() => setEditZone({ ...zone })}>Edit</Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={!isSuperAdmin}
                        onClick={async () => {
                          await dispatch(deleteNoFlyZone(zone.id)).unwrap();
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Add No-Fly Zone</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Zone Name" value={form.zoneName} onChange={(e) => setForm({ ...form, zoneName: e.target.value })} fullWidth />
              <TextField label="Base Location" value={form.baseLocation} onChange={(e) => setForm({ ...form, baseLocation: e.target.value })} fullWidth />
              <TextField label="Reason" value={form.restrictionReason} onChange={(e) => setForm({ ...form, restrictionReason: e.target.value })} fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="URC Lat" type="number" value={form.urcLat} onChange={(e) => setForm({ ...form, urcLat: e.target.value })} fullWidth />
              <TextField label="URC Lng" type="number" value={form.urcLng} onChange={(e) => setForm({ ...form, urcLng: e.target.value })} fullWidth />
              <TextField label="LLC Lat" type="number" value={form.llcLat} onChange={(e) => setForm({ ...form, llcLat: e.target.value })} fullWidth />
              <TextField label="LLC Lng" type="number" value={form.llcLng} onChange={(e) => setForm({ ...form, llcLng: e.target.value })} fullWidth />
            </Stack>
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(createNoFlyZone({
                    zoneName: form.zoneName,
                    baseLocation: form.baseLocation,
                    urcLat: Number(form.urcLat),
                    urcLng: Number(form.urcLng),
                    llcLat: Number(form.llcLat),
                    llcLng: Number(form.llcLng),
                    restrictionReason: form.restrictionReason
                  })).unwrap();
                  setCreateOpen(false);
                  setForm(createInitialForm(auth?.baseLocation));
                  refresh();
                }}
              >
                Create
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editZone)} onClose={() => setEditZone(null)} fullWidth maxWidth="md">
        <DialogTitle>Edit No-Fly Zone</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="Zone Name" value={editZone?.zoneName || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, zoneName: e.target.value }))} fullWidth />
              <TextField label="Base Location" value={editZone?.baseLocation || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, baseLocation: e.target.value }))} fullWidth />
              <TextField label="Reason" value={editZone?.restrictionReason || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, restrictionReason: e.target.value }))} fullWidth />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label="URC Lat" type="number" value={editZone?.urcLat || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, urcLat: e.target.value }))} fullWidth />
              <TextField label="URC Lng" type="number" value={editZone?.urcLng || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, urcLng: e.target.value }))} fullWidth />
              <TextField label="LLC Lat" type="number" value={editZone?.llcLat || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, llcLat: e.target.value }))} fullWidth />
              <TextField label="LLC Lng" type="number" value={editZone?.llcLng || ""} onChange={(e) => setEditZone((prev) => ({ ...prev, llcLng: e.target.value }))} fullWidth />
            </Stack>
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setEditZone(null)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(updateNoFlyZone({
                    id: editZone.id,
                    payload: {
                      zoneName: editZone.zoneName,
                      baseLocation: editZone.baseLocation,
                      urcLat: Number(editZone.urcLat),
                      urcLng: Number(editZone.urcLng),
                      llcLat: Number(editZone.llcLat),
                      llcLng: Number(editZone.llcLng),
                      restrictionReason: editZone.restrictionReason
                    }
                  })).unwrap();
                  setEditZone(null);
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
