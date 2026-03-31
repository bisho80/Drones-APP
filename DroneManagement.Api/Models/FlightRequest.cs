namespace DroneManagement.Api.Models;

/// <summary>
/// Represents a flight request submitted by a user.
/// Workflow mapping:
/// - User submits reason + URC/LLG + max altitude + phone.
/// - System checks NO FLY zones (mock rule).
/// - If restricted: status -> Rejected with reason.
/// - If clear: status -> PaymentPending, then admin can approve/reject.
/// - After payment and final approval, receipt can be generated.
/// - In incident case, request/license can be revoked and notifications sent.
/// </summary>
public class FlightRequest
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// User-defined reason for flight.
    /// </summary>
    public string Reason { get; set; } = string.Empty;

    /// <summary>
    /// Legacy plain-text location label (kept for compatibility).
    /// </summary>
    public string Location { get; set; } = string.Empty;

    /// <summary>
    /// Upper Right Corner latitude.
    /// </summary>
    public decimal UrcLat { get; set; }

    /// <summary>
    /// Upper Right Corner longitude.
    /// </summary>
    public decimal UrcLng { get; set; }

    /// <summary>
    /// Lower Left Corner latitude.
    /// </summary>
    public decimal LlgLat { get; set; }

    /// <summary>
    /// Lower Left Corner longitude.
    /// </summary>
    public decimal LlgLng { get; set; }

    /// <summary>
    /// Maximum allowed altitude for this request.
    /// </summary>
    public int MaxAltitude { get; set; }

    /// <summary>
    /// Contact phone (used for operational communication).
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// Owner user id (request creator).
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Navigation to request owner.
    /// </summary>
    public User? User { get; set; }

    /// <summary>
    /// Current workflow status.
    /// </summary>
    public FlightRequestStatus Status { get; set; } = FlightRequestStatus.Pending;

    /// <summary>
    /// Rejection explanation (admin or NO-FLY rule).
    /// </summary>
    public string? RejectionReason { get; set; }

    /// <summary>
    /// True when mock NO FLY evaluation determines this area is restricted.
    /// </summary>
    public bool IsNoFlyZone { get; set; }

    /// <summary>
    /// Human-readable reason for NO FLY decision.
    /// </summary>
    public string? NoFlyZoneReason { get; set; }

    /// <summary>
    /// Indicates payment completion after PaymentPending.
    /// </summary>
    public bool IsPaid { get; set; }

    /// <summary>
    /// Final receipt number generated after final approval.
    /// </summary>
    public string? ReceiptNumber { get; set; }

    /// <summary>
    /// Simulated email notification flag.
    /// </summary>
    public bool EmailSent { get; set; }

    /// <summary>
    /// Simulated phone/SMS notification flag.
    /// </summary>
    public bool PhoneNotificationSent { get; set; }

    /// <summary>
    /// Incident flag used to revoke/cancel an active request.
    /// </summary>
    public bool HasIncident { get; set; }

    /// <summary>
    /// Incident details for audit trail.
    /// </summary>
    public string? IncidentNote { get; set; }

    /// <summary>
    /// Request creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last update timestamp.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
