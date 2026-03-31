import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Grid,
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
import {
  createCategory,
  createLicense,
  createNoFlyZone,
  createUnit,
  deleteCategory,
  deleteLicense,
  deleteNoFlyZone,
  deleteUnit,
  fetchCategories,
  fetchLicenses,
  fetchNoFlyZones,
  fetchUnits,
  updateCategory,
  updateLicense,
  updateNoFlyZone,
  updateUnit
} from "../slices/masterDataSlice";
import { fetchDrones } from "../slices/droneSlice";
import { approveUser, disapproveUser, fetchUsers, registerUser } from "../slices/userSlice";

// Master data page:
// - User registration/approval.
// - Unit/category setup.
// - License creation.
export default function MasterDataPage() {
  const dispatch = useDispatch();
  const { units, categories, licenses, noFlyZones, error: masterError } = useSelector((state) => state.masterData);
  const usersState = useSelector((state) => state.users);
  const drones = useSelector((state) => state.drones.items);
  const auth = useSelector((state) => state.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const isSuperAdmin = auth?.role === "SuperAdmin";

  const [unitName, setUnitName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [licenseForm, setLicenseForm] = useState({ droneId: "", licenseNumber: "", expiresAt: "" });
  const [unitDrafts, setUnitDrafts] = useState({});
  const [categoryDrafts, setCategoryDrafts] = useState({});
  const [licenseDrafts, setLicenseDrafts] = useState({});
  const [noFlyDrafts, setNoFlyDrafts] = useState({});
  const [noFlyForm, setNoFlyForm] = useState({
    zoneName: "",
    baseLocation: auth?.baseLocation || "Air Base Beirut",
    urcLat: "",
    urcLng: "",
    llcLat: "",
    llcLng: "",
    restrictionReason: ""
  });
  const [userForm, setUserForm] = useState({
    username: "",
    password: "pass123",
    fullName: "",
    phone: "",
    email: "",
    baseLocation: "Air Base Beirut",
    role: "User"
  });

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchUnits());
    dispatch(fetchCategories());
    dispatch(fetchLicenses());
    dispatch(fetchNoFlyZones());
    dispatch(fetchDrones());
    dispatch(fetchUsers());
  }, [dispatch, isAdminLike]);

  const submitLicense = async (e) => {
    e.preventDefault();
    await dispatch(
      createLicense({
        droneId: Number(licenseForm.droneId),
        licenseNumber: licenseForm.licenseNumber,
        expiresAt: licenseForm.expiresAt || null,
        status: "Active"
      })
    ).unwrap();
    dispatch(fetchLicenses());
    setLicenseForm({ droneId: "", licenseNumber: "", expiresAt: "" });
  };

  return (
    <Stack spacing={3}>
      {!isAdminLike ? <Alert severity="warning">You are not allowed to access this page.</Alert> : null}
      {!isAdminLike ? null : (
      <>
      <Typography variant="h6">Master Data + User Workflow</Typography>
      {masterError ? <Alert severity="error">{masterError}</Alert> : null}
      {usersState.error ? <Alert severity="error">{usersState.error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>User Registration / Approval</Typography>
        <Stack component="form" spacing={1.5} onSubmit={async (e) => {
          e.preventDefault();
          await dispatch(registerUser(userForm)).unwrap();
          dispatch(fetchUsers());
          setUserForm({
            username: "",
            password: "pass123",
            fullName: "",
            phone: "",
            email: "",
            baseLocation: "Air Base Beirut",
            role: "User"
          });
        }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Username" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} required fullWidth />
            <TextField label="Password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required fullWidth />
            <TextField label="Full Name" value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} required fullWidth />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Phone" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} required fullWidth />
            <TextField label="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required fullWidth />
            <TextField label="Base Location" value={userForm.baseLocation} onChange={(e) => setUserForm({ ...userForm, baseLocation: e.target.value })} required fullWidth disabled={auth?.role === "Admin"} />
            <TextField
              label="Role"
              select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              helperText="Role assignment"
              required
              fullWidth
            >
              <MenuItem value="User">User</MenuItem>
              {auth?.role === "SuperAdmin" ? <MenuItem value="Admin">Admin</MenuItem> : null}
              {auth?.role === "SuperAdmin" ? <MenuItem value="SuperAdmin">SuperAdmin</MenuItem> : null}
            </TextField>
            <Button type="submit" variant="contained" fullWidth sx={{ maxWidth: { md: 180 } }}>Register User</Button>
          </Stack>
        </Stack>

        <TableContainer sx={{ overflowX: "auto", mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Base</TableCell>
                <TableCell>Approved</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersState.items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.baseLocation}</TableCell>
                  <TableCell>{u.isApproved ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Button size="small" disabled={u.isApproved} onClick={() => dispatch(approveUser(u.id))}>
                      Approve
                    </Button>
                    <Button size="small" color="warning" disabled={!u.isApproved} onClick={() => dispatch(disapproveUser(u.id))}>
                      Disapprove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} component="form" onSubmit={async (e) => {
              e.preventDefault();
              await dispatch(createUnit(unitName)).unwrap();
              dispatch(fetchUnits());
              setUnitName("");
            }}>
              <TextField label="New Unit" value={unitName} onChange={(e) => setUnitName(e.target.value)} fullWidth required />
              <Button type="submit" variant="contained" fullWidth sx={{ width: { sm: 100 } }}>Add</Button>
            </Stack>
            <TableContainer sx={{ overflowX: "auto", mt: 2 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Name</TableCell></TableRow></TableHead>
                <TableBody>
                  {units.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.id}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            value={unitDrafts[u.id] ?? u.name}
                            onChange={(e) => setUnitDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          />
                          <Button size="small" onClick={() => dispatch(updateUnit({ id: u.id, name: unitDrafts[u.id] ?? u.name }))}>Save</Button>
                          <Button size="small" color="error" onClick={() => dispatch(deleteUnit(u.id))}>Delete</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} component="form" onSubmit={async (e) => {
              e.preventDefault();
              await dispatch(createCategory(categoryName)).unwrap();
              dispatch(fetchCategories());
              setCategoryName("");
            }}>
              <TextField label="New Category" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} fullWidth required />
              <Button type="submit" variant="contained" fullWidth sx={{ width: { sm: 100 } }}>Add</Button>
            </Stack>
            <TableContainer sx={{ overflowX: "auto", mt: 2 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Name</TableCell></TableRow></TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.id}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <TextField
                            size="small"
                            value={categoryDrafts[c.id] ?? c.name}
                            onChange={(e) => setCategoryDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          />
                          <Button size="small" onClick={() => dispatch(updateCategory({ id: c.id, name: categoryDrafts[c.id] ?? c.name }))}>Save</Button>
                          <Button size="small" color="error" onClick={() => dispatch(deleteCategory(c.id))}>Delete</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>No-Fly Zones</Typography>
        <Stack component="form" spacing={1.5} onSubmit={async (e) => {
          e.preventDefault();
          await dispatch(createNoFlyZone({
            zoneName: noFlyForm.zoneName,
            baseLocation: noFlyForm.baseLocation,
            urcLat: Number(noFlyForm.urcLat),
            urcLng: Number(noFlyForm.urcLng),
            llcLat: Number(noFlyForm.llcLat),
            llcLng: Number(noFlyForm.llcLng),
            restrictionReason: noFlyForm.restrictionReason
          })).unwrap();
          setNoFlyForm((prev) => ({ ...prev, zoneName: "", urcLat: "", urcLng: "", llcLat: "", llcLng: "", restrictionReason: "" }));
        }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="Zone Name" value={noFlyForm.zoneName} onChange={(e) => setNoFlyForm({ ...noFlyForm, zoneName: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
            <TextField label="Base Location" value={noFlyForm.baseLocation} onChange={(e) => setNoFlyForm({ ...noFlyForm, baseLocation: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
            <TextField label="Reason" value={noFlyForm.restrictionReason} onChange={(e) => setNoFlyForm({ ...noFlyForm, restrictionReason: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField label="URC Lat" type="number" value={noFlyForm.urcLat} onChange={(e) => setNoFlyForm({ ...noFlyForm, urcLat: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
            <TextField label="URC Lng" type="number" value={noFlyForm.urcLng} onChange={(e) => setNoFlyForm({ ...noFlyForm, urcLng: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
            <TextField label="LLC Lat" type="number" value={noFlyForm.llcLat} onChange={(e) => setNoFlyForm({ ...noFlyForm, llcLat: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
            <TextField label="LLC Lng" type="number" value={noFlyForm.llcLng} onChange={(e) => setNoFlyForm({ ...noFlyForm, llcLng: e.target.value })} required fullWidth disabled={!isSuperAdmin} />
            <Button type="submit" variant="contained" disabled={!isSuperAdmin}>Add Zone</Button>
          </Stack>
        </Stack>

        <TableContainer sx={{ overflowX: "auto", mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Base</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>URC</TableCell>
                <TableCell>LLC</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {noFlyZones.map((z) => (
                <TableRow key={z.id}>
                  <TableCell>{z.id}</TableCell>
                  <TableCell>
                    <TextField size="small" value={noFlyDrafts[z.id]?.zoneName ?? z.zoneName} onChange={(e) => setNoFlyDrafts((prev) => ({ ...prev, [z.id]: { ...(prev[z.id] || {}), zoneName: e.target.value } }))} disabled={!isSuperAdmin} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={noFlyDrafts[z.id]?.baseLocation ?? z.baseLocation} onChange={(e) => setNoFlyDrafts((prev) => ({ ...prev, [z.id]: { ...(prev[z.id] || {}), baseLocation: e.target.value } }))} disabled={!isSuperAdmin} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={noFlyDrafts[z.id]?.restrictionReason ?? z.restrictionReason} onChange={(e) => setNoFlyDrafts((prev) => ({ ...prev, [z.id]: { ...(prev[z.id] || {}), restrictionReason: e.target.value } }))} disabled={!isSuperAdmin} />
                  </TableCell>
                  <TableCell>{z.urcLat}, {z.urcLng}</TableCell>
                  <TableCell>{z.llcLat}, {z.llcLng}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      disabled={!isSuperAdmin}
                      onClick={() => dispatch(updateNoFlyZone({
                        id: z.id,
                        payload: {
                          zoneName: noFlyDrafts[z.id]?.zoneName ?? z.zoneName,
                          baseLocation: noFlyDrafts[z.id]?.baseLocation ?? z.baseLocation,
                          urcLat: Number(noFlyDrafts[z.id]?.urcLat ?? z.urcLat),
                          urcLng: Number(noFlyDrafts[z.id]?.urcLng ?? z.urcLng),
                          llcLat: Number(noFlyDrafts[z.id]?.llcLat ?? z.llcLat),
                          llcLng: Number(noFlyDrafts[z.id]?.llcLng ?? z.llcLng),
                          restrictionReason: noFlyDrafts[z.id]?.restrictionReason ?? z.restrictionReason
                        }
                      }))}
                    >
                      Save
                    </Button>
                    <Button size="small" color="error" disabled={!isSuperAdmin} onClick={() => dispatch(deleteNoFlyZone(z.id))}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack component="form" spacing={2} onSubmit={submitLicense}>
          <TextField
            label="Drone ID"
            select
            value={licenseForm.droneId}
            onChange={(e) => setLicenseForm({ ...licenseForm, droneId: e.target.value })}
            helperText={drones.length ? `Available drones: ${drones.map((d) => d.id).join(", ")}` : "Create a drone first"}
            required
          >
            {drones.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.id} - {d.serialNumber}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="License Number"
            value={licenseForm.licenseNumber}
            onChange={(e) => setLicenseForm({ ...licenseForm, licenseNumber: e.target.value })}
            required
          />
          <TextField
            label="Expiry Date"
            type="date"
            value={licenseForm.expiresAt}
            onChange={(e) => setLicenseForm({ ...licenseForm, expiresAt: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <Button type="submit" variant="contained" sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}>
            Add License
          </Button>
        </Stack>

        <TableContainer sx={{ overflowX: "auto", mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Drone</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Expiry</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell>{license.id}</TableCell>
                  <TableCell>{license.droneId}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={licenseDrafts[license.id]?.licenseNumber ?? license.licenseNumber}
                      onChange={(e) =>
                        setLicenseDrafts((prev) => ({
                          ...prev,
                          [license.id]: { ...(prev[license.id] || {}), licenseNumber: e.target.value }
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="date"
                      value={(licenseDrafts[license.id]?.expiresAt ?? (license.expiresAt ? license.expiresAt.slice(0, 10) : ""))}
                      onChange={(e) =>
                        setLicenseDrafts((prev) => ({
                          ...prev,
                          [license.id]: { ...(prev[license.id] || {}), expiresAt: e.target.value }
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      select
                      value={licenseDrafts[license.id]?.status ?? license.status}
                      onChange={(e) =>
                        setLicenseDrafts((prev) => ({
                          ...prev,
                          [license.id]: { ...(prev[license.id] || {}), status: e.target.value }
                        }))
                      }
                    >
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Suspended">Suspended</MenuItem>
                      <MenuItem value="Revoked">Revoked</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() =>
                        dispatch(
                          updateLicense({
                            id: license.id,
                            payload: {
                              licenseNumber: licenseDrafts[license.id]?.licenseNumber ?? license.licenseNumber,
                              expiresAt: licenseDrafts[license.id]?.expiresAt || license.expiresAt || null,
                              status: licenseDrafts[license.id]?.status ?? license.status
                            }
                          })
                        )
                      }
                    >
                      Save
                    </Button>
                    <Button size="small" color="error" onClick={() => dispatch(deleteLicense(license.id))}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      </>
      )}
    </Stack>
  );
}
