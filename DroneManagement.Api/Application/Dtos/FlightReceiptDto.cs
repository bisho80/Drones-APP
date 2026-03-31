namespace DroneManagement.Api.Application.Dtos;

/// <summary>
/// Official final receipt projection for an approved permit.
/// </summary>
public class FlightReceiptDto
{
    public string PermitSerialNumber { get; set; } = string.Empty;
    public int PermitId { get; set; }
    public int DroneId { get; set; }
    public string DroneSerialNumber { get; set; } = string.Empty;
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
    public DateTime IssuedAt { get; set; }
    public DateTime ExpiryTime { get; set; }
    public string IntelligencePhone { get; set; } = string.Empty;
    public string AirForcePhone { get; set; } = string.Empty;
    public string EncryptedQrPayload { get; set; } = string.Empty;
    public string QrScanUrl { get; set; } = string.Empty;
}
