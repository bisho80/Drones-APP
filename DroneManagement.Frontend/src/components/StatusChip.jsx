import { Chip } from "@mui/material";

const colorByStatus = {
  Pending: "default",
  AwaitingInternalApproval: "default",
  PaymentPending: "warning",
  PendingPayment: "warning",
  PaymentSubmitted: "info",
  AwaitingLicense: "secondary",
  Approved: "success",
  Rejected: "error"
};

export default function StatusChip({ status }) {
  return <Chip label={status} color={colorByStatus[status] || "default"} size="small" />;
}
