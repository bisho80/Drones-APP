import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
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
import { fetchAirForceOps } from "../slices/permitSlice";
import { fetchUsers } from "../slices/userSlice";
import { sendAdminAlert } from "../slices/notificationSlice";

export default function AirForceOpsPage() {
  const dispatch = useDispatch();
  const { opsItems, loading, error } = useSelector((s) => s.permits);
  const users = useSelector((s) => s.users.items);
  const auth = useSelector((s) => s.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const isSuperAdminLike = ["SuperAdmin"].includes(auth?.role);
  const [now, setNow] = useState(Date.now());
  const [alertForm, setAlertForm] = useState({ targetAdminUsername: "", message: "", permitId: "" });
  const [flightStartAlert, setFlightStartAlert] = useState(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!isAdminLike) return;
    dispatch(fetchAirForceOps());
    const timer = setInterval(() => dispatch(fetchAirForceOps()), 10000);
    return () => clearInterval(timer);
  }, [dispatch, isAdminLike]);

  useEffect(() => {
    if (!isSuperAdminLike) return;
    dispatch(fetchUsers());
  }, [dispatch, isSuperAdminLike]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const adminTargets = useMemo(
    () => users.filter((u) => u.role === "Admin" || u.role === "SuperAdmin"),
    [users]
  );

  const grouped = useMemo(() => {
    const active = [];
    const upcoming = [];
    const finished = [];
    const incidents = [];

    for (const p of opsItems) {
      if (p.incidentReported) incidents.push(p);
      const start = new Date(p.scheduledStartTime).getTime();
      const end = p.scheduledEndTime
        ? new Date(p.scheduledEndTime).getTime()
        : p.expiresAt
          ? new Date(p.expiresAt).getTime()
          : start + 2 * 60 * 60 * 1000;
      if (p.status === "Approved" && now >= start && now <= end) active.push(p);
      else if (now < start) upcoming.push(p);
      else finished.push(p);
    }

    return { active, upcoming, finished, incidents };
  }, [opsItems, now]);

  const sortedOpsItems = useMemo(() => {
    return [...opsItems].sort((a, b) => {
      const aEnd = new Date(a.scheduledEndTime || a.expiresAt || a.scheduledStartTime).getTime();
      const bEnd = new Date(b.scheduledEndTime || b.expiresAt || b.scheduledStartTime).getTime();
      return bEnd - aEnd;
    });
  }, [opsItems]);

  const formatDuration = (ms) => {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const playSoftBuzzer = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = audioContextRef.current || new AudioCtx();
    audioContextRef.current = context;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(540, context.currentTime);
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.035, context.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2);
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 2);
  };

  useEffect(() => {
    if (!isAdminLike) return;
    const startedPermit = opsItems.find((permit) => {
      const start = new Date(permit.scheduledStartTime).getTime();
      const end = permit.scheduledEndTime
        ? new Date(permit.scheduledEndTime).getTime()
        : permit.expiresAt
          ? new Date(permit.expiresAt).getTime()
          : start + 2 * 60 * 60 * 1000;
      const seen = JSON.parse(sessionStorage.getItem("seen_started_flights") || "[]");
      return permit.status === "Approved" && now >= start && now <= end && !seen.includes(permit.id);
    });

    if (!startedPermit) return;
    setFlightStartAlert(startedPermit);
    playSoftBuzzer();
    const seen = JSON.parse(sessionStorage.getItem("seen_started_flights") || "[]");
    sessionStorage.setItem("seen_started_flights", JSON.stringify([...new Set([...seen, startedPermit.id])]));
  }, [opsItems, now, isAdminLike]);

  const closeFlightStartAlert = () => setFlightStartAlert(null);

  return (
    <Stack spacing={3}>
      {!isAdminLike ? <Alert severity="warning">You are not allowed to access this page.</Alert> : null}
      {!isAdminLike ? null : (
      <>
      <Typography variant="h6">Air Force Operations Page</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Chip color="success" label={`Flying now: ${grouped.active.length}`} />
          <Chip color="warning" label={`Upcoming: ${grouped.upcoming.length}`} />
          <Chip color="default" label={`Finished: ${grouped.finished.length}`} />
          <Chip color="error" label={`Incidents: ${grouped.incidents.length}`} />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Interactive Map (Mock)</Typography>
        <Typography variant="body2" color="text.secondary">
          Live permits with auto alert 30 minutes before scheduled start.
        </Typography>
        <Stack spacing={1} mt={1}>
          {sortedOpsItems.slice(0, 8).map((p) => (
            <Paper key={p.id} variant="outlined" sx={{ p: 1.2 }}>
              <Typography variant="body2">
                Permit #{p.id} - {p.locationLabel} ({p.flightPurpose})
              </Typography>
              <Typography variant="caption">
                URC({p.urcLat}, {p.urcLng}) | LLC({p.llcLat}, {p.llcLng})
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      {isSuperAdminLike ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Alert Center (Super Admin)</Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              label="Target Admin"
              select
              value={alertForm.targetAdminUsername}
              onChange={(e) => setAlertForm({ ...alertForm, targetAdminUsername: e.target.value })}
              fullWidth
            >
              {adminTargets.map((a) => (
                <MenuItem key={a.id} value={a.username}>
                  {a.username} ({a.baseLocation})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Permit ID (optional)"
              value={alertForm.permitId}
              onChange={(e) => setAlertForm({ ...alertForm, permitId: e.target.value })}
              fullWidth
            />
            <TextField
              label="Message"
              value={alertForm.message}
              onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => {
                dispatch(sendAdminAlert({
                  targetAdminUsername: alertForm.targetAdminUsername,
                  message: alertForm.message,
                  permitId: alertForm.permitId ? Number(alertForm.permitId) : null
                }));
                setAlertForm({ targetAdminUsername: "", message: "", permitId: "" });
              }}
            >
              Send Alert
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Paper sx={{ p: 2 }}>
        {loading ? <CircularProgress /> : null}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>User</TableCell>
                <TableCell>License / Permit</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Start</TableCell>
                <TableCell>Finish</TableCell>
                <TableCell>Minutes To Start</TableCell>
                <TableCell>Time Left</TableCell>
                <TableCell>Alert</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedOpsItems.map((p) => (
                <TableRow key={p.id} sx={{ backgroundColor: p.incidentReported ? "#ffe8e8" : undefined }}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{p.username || "-"}</TableCell>
                  <TableCell>{p.permitSerialNumber || "-"}</TableCell>
                  <TableCell>{p.phone || "-"}</TableCell>
                  <TableCell>{p.locationLabel}</TableCell>
                  <TableCell>{new Date(p.scheduledStartTime).toLocaleString()}</TableCell>
                  <TableCell>{new Date(p.scheduledEndTime || p.expiresAt || p.scheduledStartTime).toLocaleString()}</TableCell>
                  <TableCell>{p.minutesToStart}</TableCell>
                  <TableCell>
                    {(() => {
                      const start = new Date(p.scheduledStartTime).getTime();
                      const end = p.scheduledEndTime
                        ? new Date(p.scheduledEndTime).getTime()
                        : p.expiresAt
                          ? new Date(p.expiresAt).getTime()
                          : start + 2 * 60 * 60 * 1000;
                      if (now < start) return `Starts in ${formatDuration(start - now)}`;
                      if (now <= end) return `Ends in ${formatDuration(end - now)}`;
                      return `Ended ${formatDuration(now - end)} ago`;
                    })()}
                  </TableCell>
                  <TableCell>
                    {p.requiresAirForceAlert ? (
                      <Chip label="ALERT < 30 MIN" color="warning" size="small" />
                    ) : p.incidentReported ? (
                      <Chip label="Incident" color="error" size="small" />
                    ) : p.airForceAlertSent ? (
                      <Chip label="Alert Sent" color="success" size="small" />
                    ) : (
                      <Chip label="Monitoring" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(flightStartAlert)} onClose={closeFlightStartAlert} fullWidth maxWidth="sm">
        <DialogTitle>Flight Started</DialogTitle>
        <DialogContent>
          {flightStartAlert ? (
            <Stack spacing={1} sx={{ pt: 1 }}>
              <Typography><strong>User:</strong> {flightStartAlert.username}</Typography>
              <Typography><strong>Permit:</strong> {flightStartAlert.permitSerialNumber || `#${flightStartAlert.id}`}</Typography>
              <Typography><strong>Phone:</strong> {flightStartAlert.phone}</Typography>
              <Typography><strong>Start:</strong> {new Date(flightStartAlert.scheduledStartTime).toLocaleString()}</Typography>
              <Typography><strong>Finish:</strong> {new Date(flightStartAlert.scheduledEndTime || flightStartAlert.expiresAt || flightStartAlert.scheduledStartTime).toLocaleString()}</Typography>
              <Typography><strong>Location:</strong> {flightStartAlert.locationLabel}</Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFlightStartAlert} variant="contained">Acknowledge</Button>
        </DialogActions>
      </Dialog>
      </>
      )}
    </Stack>
  );
}
