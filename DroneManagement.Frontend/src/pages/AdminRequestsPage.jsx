import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
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
import StatusChip from "../components/StatusChip";
import {
  approvePermitInternally,
  clearPermitReceipt,
  confirmPermitCashPayment,
  sendRefundToAdmin,
  fetchPermitReceipt,
  fetchPermits,
  issuePermitLicense,
  payRefundToUser,
  receiveRefundByAdmin,
  rejectPermit,
  reportPermitIncident
} from "../slices/permitSlice";

export default function AdminRequestsPage() {
  const dispatch = useDispatch();
  const { items, loading, error, receipt } = useSelector((state) => state.permits);
  const auth = useSelector((s) => s.auth.user);
  const isAdminLike = ["SuperAdmin", "Admin"].includes(auth?.role);
  const [rejectReason, setRejectReason] = useState("");
  const [incidentNote, setIncidentNote] = useState("");
  const [refundPickupAt, setRefundPickupAt] = useState("");
  const [refundPickupDesk, setRefundPickupDesk] = useState("Air Base Refund Desk");
  const [qrImage, setQrImage] = useState("");

  useEffect(() => {
    dispatch(fetchPermits());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => dispatch(fetchPermits()), 5000);
    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    const qrValue = receipt?.qrScanUrl || receipt?.encryptedQrPayload;
    if (qrValue) {
      QRCode.toDataURL(qrValue, { width: 220 })
        .then((url) => {
          if (mounted) setQrImage(url);
        })
        .catch(() => setQrImage(""));
    } else {
      setQrImage("");
    }
    return () => {
      mounted = false;
    };
  }, [receipt]);

  const onCloseReceipt = () => {
    dispatch(clearPermitReceipt());
  };

  const onPrintReceipt = () => {
    if (!receipt) return;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(`
      <html><head><title>Flight Receipt ${receipt.permitSerialNumber}</title></head>
      <body style="font-family:Arial,sans-serif;padding:24px;">
        <h2>Official Flight Receipt</h2>
        <p><strong>Permit Serial:</strong> ${receipt.permitSerialNumber}</p>
        <p><strong>Drone Serial:</strong> ${receipt.droneSerialNumber}</p>
        <p><strong>Purpose:</strong> ${receipt.flightPurpose}</p>
        <p><strong>Location:</strong> ${receipt.locationLabel}</p>
        <p><strong>User Phone:</strong> ${receipt.phone}</p>
        <p><strong>Contact (Intelligence):</strong> ${receipt.intelligencePhone}</p>
        <p><strong>Contact (Air Force):</strong> ${receipt.airForcePhone}</p>
        <p><strong>Coordinates:</strong> URC(${receipt.urcLat}, ${receipt.urcLng}) - LLC(${receipt.llcLat}, ${receipt.llcLng})</p>
        <p><strong>Scheduled Start:</strong> ${new Date(receipt.scheduledStartTime).toLocaleString()}</p>
        <p><strong>Issued:</strong> ${new Date(receipt.issuedAt).toLocaleString()}</p>
        <p><strong>Expiry:</strong> ${new Date(receipt.expiryTime).toLocaleString()}</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <Stack spacing={3}>
      {!isAdminLike ? <Alert severity="warning">You are not allowed to access this page.</Alert> : null}
      {!isAdminLike ? null : (
      <>
      <Typography variant="h6">Admin Permit Workflow (Map + Table)</Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Map Preview (Mock)</Typography>
        <Typography variant="body2" color="text.secondary" mb={1}>
          Each permit is displayed as a coordinate box from URC and LLC.
        </Typography>
        <Stack spacing={1}>
          {items.slice(0, 6).map((p) => (
            <Paper key={p.id} variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2">
                <strong>Permit #{p.id}</strong> [{p.status}] - {p.locationLabel}
              </Typography>
              <Typography variant="caption">
                URC({p.urcLat}, {p.urcLng}) | LLC({p.llcLat}, {p.llcLng}) | Start {new Date(p.scheduledStartTime).toLocaleString()}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
          <TextField
            label="Reject reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
          />
          <TextField
            label="Incident note"
            value={incidentNote}
            onChange={(e) => setIncidentNote(e.target.value)}
            fullWidth
          />
          <TextField
            label="Refund Pickup Date & Time"
            type="datetime-local"
            value={refundPickupAt}
            onChange={(e) => setRefundPickupAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Refund Pickup Desk"
            value={refundPickupDesk}
            onChange={(e) => setRefundPickupDesk(e.target.value)}
            fullWidth
          />
        </Stack>

        {loading ? <CircularProgress /> : null}
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Drone</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((permit) => (
                <TableRow key={permit.id}>
                  <TableCell>{permit.id}</TableCell>
                  <TableCell>{permit.username || "-"}</TableCell>
                  <TableCell>{permit.droneSerialNumber || permit.droneId}</TableCell>
                  <TableCell>{permit.flightPurpose}</TableCell>
                  <TableCell>{permit.locationLabel}</TableCell>
                  <TableCell><StatusChip status={permit.status} /></TableCell>
                  <TableCell>{permit.permitSerialNumber || "-"}</TableCell>
                  <TableCell>
                    <ButtonGroup size="small" orientation="horizontal">
                      <Button
                        color="info"
                        onClick={() => dispatch(approvePermitInternally(permit.id))}
                        disabled={permit.status !== "AwaitingInternalApproval"}
                      >
                        Internal Approve
                      </Button>
                      <Button
                        color="success"
                        onClick={() => dispatch(confirmPermitCashPayment(permit.id))}
                        disabled={permit.status !== "PaymentSubmitted"}
                      >
                        Confirm Cash
                      </Button>
                      <Button
                        color="primary"
                        onClick={() => dispatch(issuePermitLicense(permit.id))}
                        disabled={permit.status !== "AwaitingLicense"}
                      >
                        Issue License
                      </Button>
                      <Button
                        color="error"
                        onClick={() => dispatch(rejectPermit({
                          permitId: permit.id,
                          reason: rejectReason,
                          refundPickupAt: refundPickupAt || null,
                          refundPickupDesk
                        }))}
                        disabled={permit.status === "Approved" || permit.status === "Rejected"}
                      >
                        Reject
                      </Button>
                      <Button
                        color="warning"
                        onClick={() =>
                          dispatch(
                            reportPermitIncident({
                              permitId: permit.id,
                              note: incidentNote,
                              refundPickupAt: refundPickupAt || null,
                              refundPickupDesk
                            })
                          )
                        }
                      >
                        Incident
                      </Button>
                      <Button
                        color="secondary"
                        onClick={() => dispatch(fetchPermitReceipt(permit.id))}
                        disabled={permit.status !== "Approved"}
                      >
                        Receipt
                      </Button>
                      {auth?.role === "SuperAdmin" ? (
                        <Button
                          color="inherit"
                          onClick={() => dispatch(sendRefundToAdmin(permit.id))}
                          disabled={permit.refundStatus !== "Requested"}
                        >
                          Send Refund
                        </Button>
                      ) : null}
                      {auth?.role === "Admin" ? (
                        <Button
                          color="inherit"
                          onClick={() => dispatch(receiveRefundByAdmin(permit.id))}
                          disabled={permit.refundStatus !== "SentToAdmin"}
                        >
                          Receive Refund
                        </Button>
                      ) : null}
                      {auth?.role === "Admin" ? (
                        <Button
                          color="inherit"
                          onClick={() => dispatch(payRefundToUser(permit.id))}
                          disabled={permit.refundStatus !== "ReceivedByAdmin"}
                        >
                          Pay Refund
                        </Button>
                      ) : null}
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(receipt)} onClose={onCloseReceipt} fullWidth maxWidth="md">
        <DialogTitle>Official Flight Receipt</DialogTitle>
        <DialogContent>
          {receipt ? (
            <Stack spacing={1}>
              <Typography><strong>Permit Serial:</strong> {receipt.permitSerialNumber}</Typography>
              <Typography><strong>Drone Serial:</strong> {receipt.droneSerialNumber}</Typography>
              <Typography><strong>Purpose:</strong> {receipt.flightPurpose}</Typography>
              <Typography><strong>Location:</strong> {receipt.locationLabel}</Typography>
              <Typography><strong>User Phone:</strong> {receipt.phone}</Typography>
              <Typography><strong>Coordinates:</strong> URC({receipt.urcLat}, {receipt.urcLng}) - LLC({receipt.llcLat}, {receipt.llcLng})</Typography>
              <Typography><strong>Max Altitude:</strong> {receipt.maxAltitude}</Typography>
              <Typography><strong>Scheduled Start:</strong> {new Date(receipt.scheduledStartTime).toLocaleString()}</Typography>
              <Typography><strong>Issued:</strong> {new Date(receipt.issuedAt).toLocaleString()}</Typography>
              <Typography><strong>Expiry:</strong> {new Date(receipt.expiryTime).toLocaleString()}</Typography>
              <Typography><strong>Intelligence Phone:</strong> {receipt.intelligencePhone}</Typography>
              <Typography><strong>Air Force Phone:</strong> {receipt.airForcePhone}</Typography>
              {qrImage ? <img src={qrImage} alt="Permit QR" style={{ width: 220, height: 220 }} /> : null}
              <Typography sx={{ wordBreak: "break-all" }}><strong>QR Scan URL:</strong> {receipt.qrScanUrl}</Typography>
              <Typography sx={{ wordBreak: "break-all" }}><strong>Encrypted QR Payload:</strong> {receipt.encryptedQrPayload}</Typography>
              <Button variant="contained" onClick={onPrintReceipt}>Print Receipt</Button>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
      </>
      )}
    </Stack>
  );
}
