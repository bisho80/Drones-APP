namespace DroneManagement.Api.Models;

/// <summary>
/// Core permit aggregate used by application-layer workflow.
/// </summary>
public class FlightPermit
{
    public int Id { get; set; }
    public int DroneId { get; set; }
    public Drone? Drone { get; set; }
    public string FlightPurpose { get; set; } = string.Empty;
    public string LocationLabel { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal UrcLat { get; set; }
    public decimal UrcLng { get; set; }
    public decimal LlcLat { get; set; }
    public decimal LlcLng { get; set; }
    public int MaxAltitude { get; set; }
    public DateTime ScheduledStartTime { get; set; }
    public DateTime? ScheduledEndTime { get; set; }
    public PermitStatus Status { get; set; } = PermitStatus.AwaitingInternalApproval;
    public string? RejectionReason { get; set; }
    public bool IsPaymentProcessed { get; set; }
    public string? PermitSerialNumber { get; set; }
    public bool OwnerEmailSent { get; set; }
    public bool AuthorityEmailSent { get; set; }
    public bool AirForceAlertSent { get; set; }
    public DateTime? FlightStartedNotifiedAt { get; set; }
    public bool IsLicenseRevoked { get; set; }
    public bool IsRefundIssued { get; set; }
    public RefundStatus RefundStatus { get; set; } = RefundStatus.None;
    public DateTime? RefundSentToAdminAt { get; set; }
    public DateTime? RefundReceivedByAdminAt { get; set; }
    public DateTime? RefundPaidToUserAt { get; set; }
    public DateTime? RefundPickupAt { get; set; }
    public string? RefundPickupDesk { get; set; }
    public bool IncidentReported { get; set; }
    public DateTime? IncidentAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
