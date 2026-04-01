import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { NavLink, Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "./slices/authSlice";
import { fetchPermits, payRefundToUser, receiveRefundByAdmin, sendRefundToAdmin } from "./slices/permitSlice";
import { fetchMyNotifications, markNotificationRead } from "./slices/notificationSlice";
import { useI18n } from "./i18n/i18n";

export default function App() {
  const dispatch = useDispatch();
  const { language, toggleLanguage, t } = useI18n();
  const { token, user } = useSelector((s) => s.auth);
  const permitItems = useSelector((s) => s.permits.items);
  const notifications = useSelector((s) => s.notifications.items);
  const [activeAlert, setActiveAlert] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const isAdminLike = ["SuperAdmin", "Admin"].includes(user?.role);

  useEffect(() => {
    if (!token || !isAdminLike) return;
    dispatch(fetchPermits());
    const timer = setInterval(() => dispatch(fetchPermits()), 20000);
    return () => clearInterval(timer);
  }, [dispatch, token, isAdminLike]);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchMyNotifications());
    const timer = setInterval(() => dispatch(fetchMyNotifications()), 5000);
    return () => clearInterval(timer);
  }, [dispatch, token]);

  const nextAlert = useMemo(() => {
    const seen = JSON.parse(sessionStorage.getItem("seen_permit_alerts") || "[]");
    return permitItems.find((p) => p.requiresAirForceAlert && p.status === "Approved" && !seen.includes(p.id));
  }, [permitItems]);

  useEffect(() => {
    if (nextAlert) setActiveAlert(nextAlert);
  }, [nextAlert]);

  const dismissAlert = () => {
    if (activeAlert) {
      const seen = JSON.parse(sessionStorage.getItem("seen_permit_alerts") || "[]");
      sessionStorage.setItem("seen_permit_alerts", JSON.stringify([...new Set([...seen, activeAlert.id])]));
    }
    setActiveAlert(null);
  };

  if (!token) return <Navigate to="/login" replace />;

  const moduleItems = [
    { to: "/", label: t("dashboard"), section: "General" },
    { to: "/drones", label: t("drones"), section: "General" },
    { to: "/permits", label: "Permits", section: "General" },
    ...(isAdminLike ? [{ to: "/admin-requests", label: t("adminRequests"), section: "Operations" }] : []),
    ...(isAdminLike ? [{ to: "/airforce-ops", label: t("airForceOps"), section: "Operations" }] : []),
    ...(isAdminLike ? [{ to: "/users", label: "Users", section: "Entities" }] : []),
    ...(isAdminLike ? [{ to: "/units", label: "Units", section: "Entities" }] : []),
    ...(isAdminLike ? [{ to: "/categories", label: "Categories", section: "Entities" }] : []),
    ...(isAdminLike ? [{ to: "/licenses", label: "Licenses", section: "Entities" }] : []),
    ...(isAdminLike ? [{ to: "/no-fly-zones", label: "No-Fly Zones", section: "Entities" }] : [])
  ];
  const unreadCount = notifications.filter((x) => !x.isRead).length;
  const groupedModules = moduleItems.reduce((acc, item) => {
    acc[item.section] = [...(acc[item.section] || []), item];
    return acc;
  }, {});

  return (
    <Box sx={{ minHeight: "100vh", p: { xs: 2, md: 3 }, background: "linear-gradient(135deg, #d9f1ec 0%, #f7fafc 55%, #fef3e2 100%)" }}>
      <Stack spacing={3}>
        <Paper sx={{ p: 2.5, background: "linear-gradient(90deg, #005f73, #0a9396)", color: "white" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{t("appTitle")}</Typography>
              <Typography variant="body2">
                {user?.username} ({user?.role}) - {user?.baseLocation}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button size="small" variant="outlined" sx={{ color: "white", borderColor: "white" }} onClick={toggleLanguage}>
                {language === "en" ? "AR" : "EN"}
              </Button>
              <Button variant="outlined" sx={{ color: "white", borderColor: "white" }} onClick={() => setShowNotifications(true)}>
                {t("notifications")} ({unreadCount})
              </Button>
              <Button color="inherit" variant="contained" sx={{ bgcolor: "rgba(255,255,255,0.14)" }} onClick={() => dispatch(logout())}>
                {t("logout")}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "280px minmax(0, 1fr)" },
            gap: 3,
            alignItems: "start"
          }}
        >
          <Paper sx={{ p: 2, position: { lg: "sticky" }, top: { lg: 24 }, borderRadius: "5px" }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Modules</Typography>
                <Chip size="small" color="primary" label={user?.role} />
              </Stack>
              {Object.entries(groupedModules).map(([section, items]) => (
                <Stack key={section} spacing={1}>
                  <Typography variant="overline" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    {section}
                  </Typography>
                  {items.map((item) => (
                    <Button
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      end={item.to === "/"}
                      variant="text"
                      sx={{
                        justifyContent: "flex-start",
                        px: 1.5,
                        py: 1.1,
                        borderRadius: "5px",
                        color: "text.primary",
                        "&.active": {
                          bgcolor: "#0a9396",
                          color: "white"
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              ))}
            </Stack>
          </Paper>

          <Stack spacing={3}>
            <Outlet />
          </Stack>
        </Box>
      </Stack>

      <Dialog open={Boolean(activeAlert)} onClose={dismissAlert} fullWidth maxWidth="sm">
        <DialogTitle>Flight Alert - less than 30 minutes</DialogTitle>
        <DialogContent>
          {activeAlert ? (
            <Stack spacing={1}>
              <Typography><strong>User:</strong> {activeAlert.username}</Typography>
              <Typography><strong>Drone:</strong> {activeAlert.droneSerialNumber}</Typography>
              <Typography><strong>Phone:</strong> {activeAlert.phone}</Typography>
              <Typography><strong>Purpose:</strong> {activeAlert.flightPurpose}</Typography>
              <Typography><strong>Location:</strong> {activeAlert.locationLabel}</Typography>
              <Typography><strong>Start:</strong> {new Date(activeAlert.scheduledStartTime).toLocaleString()}</Typography>
              <Typography><strong>URC:</strong> {activeAlert.urcLat}, {activeAlert.urcLng}</Typography>
              <Typography><strong>LLC:</strong> {activeAlert.llcLat}, {activeAlert.llcLng}</Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={dismissAlert} variant="contained">Acknowledge</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showNotifications} onClose={() => setShowNotifications(false)} fullWidth maxWidth="sm">
        <DialogTitle>In-App Notifications</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {notifications.length === 0 ? <Typography>No notifications.</Typography> : null}
            {notifications.map((n) => (
              <Paper key={n.id} variant="outlined" sx={{ p: 1.2, borderColor: n.isRead ? "divider" : "warning.main" }}>
                <Typography variant="body2"><strong>From:</strong> {n.senderUsername}</Typography>
                <Typography variant="body2">{n.message}</Typography>
                <Typography variant="caption">{new Date(n.createdAt).toLocaleString()}</Typography>
                {(() => {
                  const permit = permitItems.find((p) => p.id === n.permitId);
                  if (!permit || !n.permitId) return null;

                  if (user?.role === "SuperAdmin" && permit.refundStatus === "Requested") {
                    return (
                      <Stack mt={1}>
                        <Button size="small" onClick={() => dispatch(sendRefundToAdmin(n.permitId))}>Send Refund</Button>
                      </Stack>
                    );
                  }

                  if (user?.role === "Admin" && permit.refundStatus === "SentToAdmin") {
                    return (
                      <Stack mt={1}>
                        <Button size="small" onClick={() => dispatch(receiveRefundByAdmin(n.permitId))}>Receive Refund</Button>
                      </Stack>
                    );
                  }

                  if (user?.role === "Admin" && permit.refundStatus === "ReceivedByAdmin") {
                    return (
                      <Stack mt={1}>
                        <Button size="small" onClick={() => dispatch(payRefundToUser(n.permitId))}>Pay Refund</Button>
                      </Stack>
                    );
                  }

                  return null;
                })()}
                {!n.isRead ? (
                  <Stack mt={1}>
                    <Button size="small" onClick={() => dispatch(markNotificationRead(n.id))}>Mark Read</Button>
                  </Stack>
                ) : null}
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotifications(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
