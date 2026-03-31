import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  CircularProgress,
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
import StatusChip from "../components/StatusChip";
import { fetchMyDrones } from "../slices/droneSlice";
import {
  fetchPermits,
  fetchMyPermits,
  submitPermitPayment,
  submitPermitRequest
} from "../slices/permitSlice";
import { useI18n } from "../i18n/i18n";

function getLebanonInput(minutesOffset = 0) {
  const dt = new Date(Date.now() + minutesOffset * 60000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Beirut",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(dt);

  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

function createInitialForm() {
  return {
    username: "",
    droneId: "",
    flightPurpose: "",
    locationLabel: "",
    phone: "",
    scheduledStartTime: getLebanonInput(0),
    scheduledEndTime: getLebanonInput(120),
    urcLat: "33.970000",
    urcLng: "35.720000",
    llcLat: "33.950000",
    llcLng: "35.700000",
    maxAltitude: 120
  };
}

export default function FlightRequestPage() {
  const dispatch = useDispatch();
  const { t } = useI18n();
  const { items, loading, error } = useSelector((state) => state.permits);
  const dronesState = useSelector((state) => state.drones);
  const auth = useSelector((s) => s.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const [form, setForm] = useState(() => ({ ...createInitialForm(), username: auth?.username || "" }));

  useEffect(() => {
    if (isAdminLike) {
      dispatch(fetchPermits());
    } else {
      dispatch(fetchMyDrones());
      dispatch(fetchMyPermits());
    }
  }, [dispatch, isAdminLike]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (isAdminLike) {
        dispatch(fetchPermits());
      } else {
        dispatch(fetchMyPermits());
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [dispatch, isAdminLike]);

  useEffect(() => {
    if (!form.droneId && dronesState.items.length > 0) {
      setForm((prev) => ({ ...prev, droneId: String(dronesState.items[0].id) }));
    }
  }, [dronesState.items, form.droneId]);

  const onSubmit = async (event) => {
    event.preventDefault();
    await dispatch(submitPermitRequest({
      droneId: Number(form.droneId),
      flightPurpose: form.flightPurpose,
      locationLabel: form.locationLabel,
      phone: form.phone,
      scheduledStartTime: form.scheduledStartTime,
      scheduledEndTime: form.scheduledEndTime,
      urcLat: Number(form.urcLat),
      urcLng: Number(form.urcLng),
      llcLat: Number(form.llcLat),
      llcLng: Number(form.llcLng),
      maxAltitude: Number(form.maxAltitude)
    })).unwrap();

    if (isAdminLike) {
      await dispatch(fetchPermitsByUsername(form.username));
    } else {
      await dispatch(fetchMyPermits());
    }

    setForm((prev) => ({
      ...createInitialForm(),
      username: prev.username,
      droneId: prev.droneId || (dronesState.items[0] ? String(dronesState.items[0].id) : "")
    }));
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{isAdminLike ? t("permitTracking") : t("permitRequestForm")}</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}

      {!isAdminLike ? <Paper sx={{ p: 2 }}>
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <TextField
            label="Drone ID"
            select
            value={form.droneId}
            onChange={(e) => setForm({ ...form, droneId: e.target.value })}
            required
            helperText={dronesState.items.length ? `Drones: ${dronesState.items.map((d) => `${d.id} (${d.serialNumber})`).join(", ")}` : "No drones available."}
          >
            {dronesState.items.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.id} - {d.serialNumber}</MenuItem>
            ))}
          </TextField>
          <TextField label="Flight Purpose" value={form.flightPurpose} onChange={(e) => setForm({ ...form, flightPurpose: e.target.value })} required />
          <TextField label="Location Label" value={form.locationLabel} onChange={(e) => setForm({ ...form, locationLabel: e.target.value })} required />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <TextField label="Scheduled Start Time" type="datetime-local" value={form.scheduledStartTime} onChange={(e) => setForm({ ...form, scheduledStartTime: e.target.value })} InputLabelProps={{ shrink: true }} required />
          <TextField label="Scheduled End Time" type="datetime-local" value={form.scheduledEndTime} onChange={(e) => setForm({ ...form, scheduledEndTime: e.target.value })} InputLabelProps={{ shrink: true }} required />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="URC Latitude" type="number" value={form.urcLat} onChange={(e) => setForm({ ...form, urcLat: e.target.value })} required fullWidth />
            <TextField label="URC Longitude" type="number" value={form.urcLng} onChange={(e) => setForm({ ...form, urcLng: e.target.value })} required fullWidth />
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField label="LLC Latitude" type="number" value={form.llcLat} onChange={(e) => setForm({ ...form, llcLat: e.target.value })} required fullWidth />
            <TextField label="LLC Longitude" type="number" value={form.llcLng} onChange={(e) => setForm({ ...form, llcLng: e.target.value })} required fullWidth />
          </Stack>
          <TextField label="Max Altitude" type="number" value={form.maxAltitude} onChange={(e) => setForm({ ...form, maxAltitude: e.target.value })} required />
          <Button type="submit" variant="contained" sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}>{t("submitPermit")}</Button>
        </Stack>
      </Paper> : <Alert severity="info">{t("adminReadonlyPermitInfo")}</Alert>}

      <Paper>
        {loading ? <Stack p={2}><CircularProgress /></Stack> : null}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Drone</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>End</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rejection</TableCell>
                <TableCell>Rejected At</TableCell>
                <TableCell>Refund Pickup</TableCell>
                <TableCell>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell>{permit.id}</TableCell>
                  <TableCell>{permit.droneSerialNumber || permit.droneId}</TableCell>
                  <TableCell>{permit.flightPurpose}</TableCell>
                  <TableCell>{permit.locationLabel}</TableCell>
                  <TableCell>{permit.scheduledStartTime ? new Date(permit.scheduledStartTime).toLocaleString() : "-"}</TableCell>
                  <TableCell>{permit.scheduledEndTime ? new Date(permit.scheduledEndTime).toLocaleString() : "-"}</TableCell>
                  <TableCell><StatusChip status={permit.status} /></TableCell>
                  <TableCell>{permit.rejectionReason || "-"}</TableCell>
                  <TableCell>{permit.rejectedAt ? new Date(permit.rejectedAt).toLocaleString() : "-"}</TableCell>
                  <TableCell>
                    {permit.refundPickupAt ? `${new Date(permit.refundPickupAt).toLocaleString()}${permit.refundPickupDesk ? ` - ${permit.refundPickupDesk}` : ""}` : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={permit.status !== "PendingPayment"}
                      onClick={() => dispatch(submitPermitPayment(permit.id))}
                    >
                      {t("submitCash")}
                    </Button>
                    {permit.status === "PaymentSubmitted" || permit.status === "AwaitingLicense" ? ` ${t("waitingAdmin")}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  );
}
