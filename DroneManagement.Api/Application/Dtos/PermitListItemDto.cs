using DroneManagement.Api.Models;

namespace DroneManagement.Api.Application.Dtos;

public class PermitListItemDto
{
    public int Id { get; set; }
    public int DroneId { get; set; }
    public string DroneSerialNumber { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string UserBaseLocation { get; set; } = string.Empty;
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
    public int MinutesToStart { get; set; }
    public bool RequiresAirForceAlert { get; set; }
    public PermitStatus Status { get; set; }
    public string? RejectionReason { get; set; }
    public bool IsPaymentProcessed { get; set; }
    public string? PermitSerialNumber { get; set; }
    public bool OwnerEmailSent { get; set; }
    public bool AuthorityEmailSent { get; set; }
    public bool AirForceAlertSent { get; set; }
    public bool IsLicenseRevoked { get; set; }
    public bool IsRefundIssued { get; set; }
    public RefundStatus RefundStatus { get; set; }
    public DateTime? RefundSentToAdminAt { get; set; }
    public DateTime? RefundReceivedByAdminAt { get; set; }
    public DateTime? RefundPaidToUserAt { get; set; }
    public DateTime? RefundPickupAt { get; set; }
    public string? RefundPickupDesk { get; set; }
    public bool IncidentReported { get; set; }
    public DateTime? IncidentAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
