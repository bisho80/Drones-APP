import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CircularProgress, Grid, Paper, Stack, Typography } from "@mui/material";
import { fetchDrones } from "../slices/droneSlice";
import { fetchLicenses, fetchUnits, fetchCategories } from "../slices/masterDataSlice";
import { fetchUsers } from "../slices/userSlice";
import { fetchPermits } from "../slices/permitSlice";
import { fetchMyPermits } from "../slices/permitSlice";
import { fetchMyDrones } from "../slices/droneSlice";

function StatCard({ title, value, color }) {
  return (
    <Paper sx={{ p: 2, borderTop: `5px solid ${color}` }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Paper>
  );
}

// Dashboard summary screen for admin-level quick monitoring.
export default function DashboardPage() {
  const dispatch = useDispatch();
  const dronesState = useSelector((s) => s.drones);
  const permitState = useSelector((s) => s.permits);
  const masterState = useSelector((s) => s.masterData);
  const usersState = useSelector((s) => s.users);
  const auth = useSelector((s) => s.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);

  useEffect(() => {
    if (isAdminLike) {
      dispatch(fetchDrones());
      dispatch(fetchPermits());
      dispatch(fetchUnits());
      dispatch(fetchCategories());
      dispatch(fetchLicenses());
      dispatch(fetchUsers());
    } else {
      dispatch(fetchMyDrones());
      dispatch(fetchMyPermits());
    }
  }, [dispatch, isAdminLike]);

  const requests = permitState.items;
  const approved = requests.filter((x) => x.status === "Approved").length;
  const rejected = requests.filter((x) => x.status === "Rejected").length;
  const paymentPending = requests.filter((x) => x.status === "PendingPayment").length;
  const paymentSubmitted = requests.filter((x) => x.status === "PaymentSubmitted").length;
  const awaitingLicense = requests.filter((x) => x.status === "AwaitingLicense").length;
  const awaitingInternal = requests.filter((x) => x.status === "AwaitingInternalApproval").length;

  const loading = dronesState.loading || permitState.loading || (isAdminLike && (masterState.loading || usersState.loading));

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Operations Dashboard</Typography>
      {loading ? <CircularProgress /> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Users" value={isAdminLike ? usersState.items.length : 1} color="#3a86ff" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Drones" value={dronesState.items.length} color="#005f73" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Units / Categories" value={isAdminLike ? `${masterState.units.length} / ${masterState.categories.length}` : "-"} color="#0a9396" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Licenses" value={isAdminLike ? masterState.licenses.length : "-"} color="#9b5de5" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Permits" value={requests.length} color="#264653" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Awaiting Internal" value={awaitingInternal} color="#ee9b00" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Payment Pending" value={paymentPending} color="#f4a261" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Payment Submitted" value={paymentSubmitted} color="#4d908e" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Awaiting License" value={awaitingLicense} color="#7b2cbf" /></Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="Approved / Rejected" value={`${approved} / ${rejected}`} color="#2a9d8f" /></Grid>
      </Grid>
    </Stack>
  );
}
