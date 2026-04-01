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
import { createCategory, deleteCategory, fetchCategories, updateCategory } from "../slices/masterDataSlice";

export default function CategoriesPage() {
  const dispatch = useDispatch();
  const { categories, error } = useSelector((state) => state.masterData);
  const auth = useSelector((state) => state.auth.user);
  const isSuperAdmin = auth?.role === "SuperAdmin";
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchCategories());
  }, [dispatch, isAdminLike]);

  if (!isAdminLike) {
    return <Alert severity="warning">You are not allowed to access this page.</Alert>;
  }

  const refresh = () => dispatch(fetchCategories());

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2.5, borderRadius: "5px" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Categories Module</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage drone categories from dedicated modal forms.
            </Typography>
          </Stack>
          <Button variant="contained" disabled={!isSuperAdmin} onClick={() => { setName(""); setCreateOpen(true); }}>
            Add Category
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
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" disabled={!isSuperAdmin} onClick={() => setEditCategory(category)}>Edit</Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={!isSuperAdmin}
                        onClick={async () => {
                          await dispatch(deleteCategory(category.id)).unwrap();
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
        <DialogTitle>Add Category</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Category Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(createCategory(name)).unwrap();
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

      <Dialog open={Boolean(editCategory)} onClose={() => setEditCategory(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Category Name"
              value={editCategory?.name || ""}
              onChange={(e) => setEditCategory((prev) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <DialogActions sx={{ px: 0 }}>
              <Button onClick={() => setEditCategory(null)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await dispatch(updateCategory({ id: editCategory.id, name: editCategory.name })).unwrap();
                  setEditCategory(null);
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
