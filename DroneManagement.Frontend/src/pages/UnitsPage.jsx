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
import { createUnit, deleteUnit, fetchUnits, updateUnit } from "../slices/masterDataSlice";

export default function UnitsPage() {
  const dispatch = useDispatch();
  const { units, error } = useSelector((state) => state.masterData);
  const auth = useSelector((state) => state.auth.user);
  const isSuperAdmin = auth?.role === "SuperAdmin";
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchUnits());
  }, [dispatch, isAdminLike]);

  if (!isAdminLike) {
    return <Alert severity="warning">You are not allowed to access this page.</Alert>;
  }

  const refresh = () => dispatch(fetchUnits());

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5, borderRadius: "5px" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Units Module</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage organizational units through modal create and edit flows.
            </Typography>
          </Stack>
          <Button variant="contained" disabled={!isSuperAdmin} onClick={() => { setName(""); setCreateOpen(true); }}>
            Add Unit
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
                <TableCell>Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>{unit.id}</TableCell>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" disabled={!isSuperAdmin} onClick={() => setEditUnit(unit)}>Edit</Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={!isSuperAdmin}
                        onClick={async () => {
                          await dispatch(deleteUnit(unit.id)).unwrap();
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
        <DialogTitle>Add Unit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Unit Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(createUnit(name)).unwrap();
                  setCreateOpen(false);
                  setName("");
                  refresh();
                }}
              >
                Create
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editUnit)} onClose={() => setEditUnit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Unit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Unit Name"
              value={editUnit?.name || ""}
              onChange={(e) => setEditUnit((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setEditUnit(null)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(updateUnit({ id: editUnit.id, name: editUnit.name })).unwrap();
                  setEditUnit(null);
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
